const express = require("express");
const axios = require("axios");
const path = require('path');
const cors = require('cors');
const { constant } = require("vega");
const natural = require('natural');
const stopword = require('stopword');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const { re } = require('natural/lib/natural');
require('dotenv').config();

const app = express();
const PORT = 8000; 


app.use(cors()); 
app.use(express.json());

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error('OpenAI API key is missing. Please set it in the .env file.');
  process.exit(1); 
}

const openaiApiEndpoint = "https://api.openai.com/v1/completions";
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('/api', (req, res)=>{
  res.send('Hello, API')
})

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

const preprocess = (text) => {
  let tokenizer = new natural.WordTokenizer();
  let words = tokenizer.tokenize(text.toLowerCase());
  words = stopword.removeStopwords(words);
  return words;
};

const calculateSimilarity = (questionTokens, rowTokens) => {
  let questionSet = new Set(questionTokens);
  let rowSet = new Set(rowTokens);
  let intersection = new Set([...questionSet].filter(x => rowSet.has(x)));
  let similarity = intersection.size / (questionSet.size + rowSet.size - intersection.size);
  return similarity;
};

const jaccardCoefficient = (setA, setB) => {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
};

const getSchema = (db, db_id, tableNames, question, limit) => {
  return new Promise((resolve, reject) => {
    let tables = "";
    let databaseFile = path.join(db_id, db, `${db}.sqlite`);
    // console.log('Database File Path:', databaseFile); // Debugging statement
    let conn = new sqlite3.Database(databaseFile, sqlite3.OPEN_READONLY);

    const tablePromises = tableNames.map((tableName) => {
      return new Promise((resolve, reject) => {
        conn.serialize(() => {
          conn.get("SELECT sql FROM sqlite_master WHERE type='table' AND LOWER(name)=?", [tableName.toLowerCase()], (err, row) => {
            if (err) {
              console.error(err.message);
              reject(err);
              return;
            }
            let ddl = row.sql;
            // console.log('ddl', ddl);
            if (limit) {
              conn.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
                if (err) {
                  console.error(err.message);
                  reject(err);
                  return;
                }
                let columnNames = Object.keys(rows[0]);
                let questionTokens = preprocess(question);
                let similarities = rows.map(row => {
                  let rowText = Object.values(row).join(' ');
                  let rowTokens = preprocess(rowText);
                  let similarity = calculateSimilarity(questionTokens, rowTokens);
                  return { similarity, row };
                });

                similarities.sort((a, b) => b.similarity - a.similarity);
                let topRows = similarities.slice(0, limit).map(item => item.row);
                let selectResult = topRows.map(row => Object.values(row));
                let selectStatement = `SELECT * FROM ${tableName} LIMIT ${limit};`;
                let data = `${ddl.toLowerCase()}\nSELECT Statement:\n${selectStatement.toLowerCase()}\nQuery Result:\n${JSON.stringify(selectResult)}`;
                resolve(data);
              });
            } else {
              resolve(ddl.toLowerCase());
            }
          });
        });
      });
    });

    Promise.all(tablePromises).then(results => {
      tables = results.join('\n');
      conn.close();
      resolve(tables);
    }).catch(err => {
      conn.close();
      reject(err);
    });
  });
};


const searchExampleByQuestion = async (question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id) => {
  let dictionary = new natural.TfIdf();
  let tokenizedDocuments = exampleEncoderQuestions.map(text => preprocess(text));
  tokenizedDocuments.forEach(doc => dictionary.addDocument(doc.join(' ')));
  
  let queryTokens = preprocess(question);
  let queryStr = queryTokens.join(' ');
  dictionary.tfidf(queryStr, 0); // Only need the tfidf vector for the query
  let sims = tokenizedDocuments.map((doc, i) => ({ similarity: jaccardCoefficient(new Set(doc), new Set(queryTokens)), index: i }));
  sims.sort((a, b) => b.similarity - a.similarity);
  
  let topIndexes = sims.slice(0, nshot).map(sim => sim.index);
  let exampleData = "";
  let tables = [];

  for (let i of topIndexes) {
    let query = exampleEncoderQuestions[i].trim();
    let [g, db] = exampleDecoderAnswers[i].trim().split('\t');
    let tableNames = [...new Set([...g.matchAll(/ FROM\s+([^\s,(]+)/gi), ...g.matchAll(/ JOIN\s+([^\s,]+)/gi)].map(m => m[1].replace(/[()]/g, '')))];
    let dbStr = await Promise.all(tableNames.filter(t => !tables.includes(t)).map(async t => {
      tables.push(t);
      const dbeg = await getSchema(db, db_id, [t], query, limitTable);
      // console.log('db', dbeg);
      return dbeg;
    }));
    exampleData += `${dbStr.join('')} \nQuestion: ${query}, \nVQL: ${g} \n`;
    // console.log('expdata', exampleData);
  }

  return exampleData;
};


const composePrompt = async (data, question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id) => {
  let dbPrompt = data;
  let preText = 'Please generate VQL based on DDL table and question.';

  let exampleData = await searchExampleByQuestion(question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);
  question = '\nQuestion: ' + question + '\nVQL:';
  let prompt = `${preText} This is an example: \n${exampleData} Now, 
  You are an expert in generating Visual Query Language (VQL) queries based on given data structures and questions. Please follow these guidelines:

JOIN Clause: When performing joins, use the table.column format. Do not rename or alias the table names (i.e., do not use the AS keyword).
Other Operations: For all other operations (e.g., SELECT, FROM, GROUP BY, ORDER BY, BIN BY), use only the column names without the table prefix.
SELECT Statement includes only column names or optional aggregate functions (e.g., avg, sum, count,max,min).
The BIN BY options are: year, month, week, day, weekday, quarter.
GROUP BY and ORDER BY Clauses use only columns.
No Nested Queries: The VQL should be simple and straightforward without any nested SQL queries or subqueries.
Format: Generate the VQL in a single line, starting with the keyword visualize.
please generate VQL to answer this question based on json table. Generate VQL in one line and begin with : visualize\n${JSON.stringify(dbPrompt)}${question}`;
  return prompt;
};

function validateVQL(vql, tableSchema) {
  const validTypes = ['pie', 'scatter', 'line', 'bar'];
  const visualizeRegex = /^visualize\s+(pie|scatter|line|bar)/i;

  if (!visualizeRegex.test(vql)) {
    console.error('Validation Failed: VQL must start with "visualize" followed by a valid type (e.g., pie, scatter, line, bar).');
    return false;
  }

  const hasAlias = /\bAS\b/i.test(vql);
  if (hasAlias) {
      console.error('Validation Failed: VQL uses aliasing (AS keyword).');
      return false;
  }

  const joinRegex = /join\s+\w+\.\w+/i;
  const nonJoinRegex = /(select|where|group\s+by|order\s+by|bin\s+by)\s+[^\s]+\.\w+/i;

  // Check for table.column outside of JOIN clauses
  const match = vql.match(nonJoinRegex);
  if (match) {
      console.error('Error: Do not use table.column outside of JOIN clauses.');
      return false;
  }

  // Extract SELECT, GROUP BY, BIN BY, and FROM clauses
  const selectMatch = vql.match(/select\s+(.+?)\s+from/i);
  const groupByMatch = vql.match(/group\s+by\s+(.+?)(\s+order\s+by|\s*$)/i);
  const binByMatch = vql.match(/bin\s+by\s+(.+?)(\s+group\s+by|\s+order\s+by|\s*$)/i);
  const fromMatch = vql.match(/from\s+(\w+)/i);

  if (!selectMatch || !groupByMatch || !fromMatch) {
      console.error('Error: Unable to parse SELECT, GROUP BY, or FROM clauses.');
      return false;
  }

  const selectElements = selectMatch[1].split(',').map(el => el.trim().split(' ')[0]);
  const groupByElements = groupByMatch[1].split(',').map(el => el.trim());
  const binByElements = binByMatch ? binByMatch[1].split(',').map(el => `binBy_${el.trim()}`) : [];
  const fromTable = fromMatch[1].trim();

  // Validate each element in GROUP BY
  for (const groupEl of groupByElements) {
      if (!selectElements.includes(groupEl) && 
          !binByElements.includes(groupEl) && 
          !tableSchema[fromTable].includes(groupEl)) {
          console.error(`Error: GROUP BY element "${groupEl}" is not valid. It must be in SELECT, BIN BY, or a column from the table "${fromTable}".`);
          return false;
      }
  }

  const hasNestedQueries = /\(\s*SELECT\b/i.test(vql);
  if (hasNestedQueries) {
      console.error('Validation Failed: VQL contains nested queries.');
      return false;
  }

  console.log('Validation Passed: VQL is valid.');
  return true;
}


async function callOpenAIWithRetryforVQL(prompt, tableSchema, retries = 10, lastError = '') {
  try {
    if (lastError) {
      prompt += `\nPlease note: ${lastError}`;
    }

    const response = await axios.post(
      openaiApiEndpoint,
      {
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        temperature: 1,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    const generatedText = response.data.choices[0].text.trim();
    console.log('Generated VQL:', generatedText);

    if (validateVQL(generatedText, tableSchema)) {
      return generatedText;
    } else {
      throw new Error('Generated VQL does not meet the guidelines.');
    }
  } catch (error) {
    console.error('Error during OpenAI API call:', error.message);
    if (retries > 0) {
      let errorMessage = '';
      if (error.message.includes('aliasing')) {
        errorMessage = 'Do not use the AS keyword for aliasing table names.';
      } else if (error.message.includes('table.column')) {
        errorMessage = 'Make sure do not use table.column outside of JOIN clauses.';
      } else if (error.message.includes('nested queries')) {
        errorMessage = 'Avoid using nested queries.';
      } else if (error.message.includes('visualize')) {
        errorMessage = 'VQL must start with "visualization" followed by a valid type (e.g., pie, scatter, line, bar).';
      } else if (error.message.includes('GROUP BY element')) {
        errorMessage = 'Ensure that elements in GROUP BY are either in SELECT, BIN BY, or the table schema.';
      } else {
        errorMessage = 'Please adhere strictly to the provided guidelines.';
      }

      console.log(`Retrying with additional instruction: ${errorMessage} (${retries} attempts left)`);
      return callOpenAIWithRetryforVQL(prompt, tableSchema, retries - 1, errorMessage);
    } else {
      throw new Error('Failed to generate valid VQL from OpenAI after multiple attempts');
    }
  }
}


app.post('/api/generate-vegalite', async (req, res) => {
  console.time('GET * VQL Request Duration');
  const { query, data } = req.body;
  // console.log('Received POST request');
  // console.log('Query:', query);
  // console.log('Data:', data);

  const db_id = './utils/data/database'; // Set the db_id based on your directory structure
  const exampleEncoderQuestions = fs.readFileSync('./utils/data/train/train_encode.txt', 'utf-8').split('\n');
  const exampleDecoderAnswers = fs.readFileSync('./utils/data/train/train_decode_db.txt', 'utf-8').split('\n');
  const limitTable = 0;
  const nshot = 10;

  // try {
  //   const prompt = await composePrompt(data, query, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);

  //   // console.log('api', openaiApiKey);
  //   console.log('prompt', prompt);

  //   const response = await axios.post(
  //     openaiApiEndpoint,
  //     {
  //       model: "gpt-3.5-turbo-instruct",
  //       prompt: prompt,
  //       temperature: 1,
  //       max_tokens: 1000,
  //       top_p: 1,
  //       frequency_penalty: 0,
  //       presence_penalty: 0,
  //     },
  //     {
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${openaiApiKey}`,
  //       },
  //       // proxy: {
  //       //   protocol: "http",
  //       //   host: "127.0.0.1",
  //       //   port: 7890,
  //       // },
  //     }
  //   );

  //   const generatedText = response.data.choices[0].text;
  //   console.timeEnd('GET * VQL Request Duration');
  //   console.log(generatedText)
  //   res.json({ VQL: generatedText });
  // } catch (error) {
  //   console.error('Error:', error.message);
  //   if (error.response) {
  //     console.error('Status:', error.response.status);
  //     console.error('Headers:', error.response.headers);
  //     console.error('Data:', error.response.data);
  //   }
  //   res.status(500).json({ error: error.message });
  // }
  try {
    const prompt = await composePrompt(data, query, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);

    console.log('Generated Prompt:', prompt);

    const generatedText = await callOpenAIWithRetryforVQL(prompt,data);

    console.timeEnd('GET * VQL Request Duration');
    console.log('Generated VQL:', generatedText);
    res.json({ VQL: generatedText });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
});

function extractJSON(text) {
  const startIndex = text.indexOf('{');
  const endIndex = text.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const jsonString = text.slice(startIndex, endIndex + 1);
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error parsing extracted JSON:', error.message);
      return null;
    }
  }
  return null;
}

async function callOpenAIWithRetry(prompt, retries = 10) {
  try {
    const response = await axios.post(
      `${openaiApiEndpoint}`,
      {
        model: "gpt-3.5-turbo-instruct",
        prompt: prompt,
        temperature: 1,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    const responseText = response.data.choices[0].text.trim();
    const explanation = extractJSON(responseText);

    if (explanation) {
      return explanation;
    } else {
      throw new Error('No valid JSON found in the response');
    }
  } catch (error) {
    console.error('Error during processing:', error.message);
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      return callOpenAIWithRetry(prompt, retries - 1);
    } else {
      throw new Error('Failed to get valid JSON from OpenAI after multiple attempts');
    }
  }
}

app.post('/api/explain-vql', async (req, res) => {
  console.time('POST /api/explain-vql Duration');
  const { VQL } = req.body;
  const VQL_exp = 'VISUALIZE bar\\nSELECT date, AVG(price)\\nFROM price\\nJOIN name ON price.id = name.id\\nWHERE (price > 150 AND price < 2000) OR year > 2000\\nGROUP BY date\\nORDER BY avg(price) DESC\\nBIN BY quarter'

  const explanation_exp={
    "explanation": [
      {
        "step": 1,
        "operation": "FROM",
        "description": "Specify the source table price.",
        "clause": "FROM price"
      },
      {
        "step": 2,
        "operation": "JOIN",
        "description": "Join the table price on id with the table name on id.",
        "clause": "JOIN name ON price.id = name.id"
      },
      {
        "step": 3,
        "operation": "WHERE",
        "description": "Filter data to include only the items where the price is greater than 150 and less than 2000, or the year is greater than 2000.",
        "conditions": [
          {
            "condition": "(price > 150 AND price < 2000)",
            "explanation": "Select records where the price is between 150 and 2000."
          },
          {
            "condition": "OR year > 2000",
            "explanation": "Select records where the year is greater than 2000, and extend to the results."
          }
        ],
        "clause": "WHERE (price > 150 AND price < 2000) OR year > 2000"
      },
      {
        "step": 4,
        "operation": "GROUP BY",
        "description": "Group data by date.",
        "clause": "GROUP BY date"
      },
      {
        "step": 5,
        "operation": "SELECT",
        "description": "Select the date and the average of price columns.",
        "clause": "SELECT date, AVG(price)"
      },
      {
        "step": 6,
        "operation": "ORDER BY",
        "description": "Order the results by AVG(price) in descending order.",
        "clause": "ORDER BY AVG(price) DESC"
      },
      {
        "step": 7,
        "operation": "BIN BY",
        "description": "Bin the date by quarter.",
        "clause": "BIN BY quarter"
      },
      {
        "step": 8,
        "operation": "VISUALIZE",
        "description": "Visualize the results as a bar chart.",
        "clause": "VISUALIZE bar"
      }]
  }
  const prompt = `You are a excellent software engineer or developer. I have an example of a VQL (Visual Query Language) and its corresponding explanation in a specific JSON format. 

  Example VQL:
  ${VQL_exp}

  Example Explanation in JSON:
  ${JSON.stringify(explanation_exp, null, 2)}

  Expected JSON Format:
  {
    "explanation": [
      {
        "step": "execution order",
        "operation": "Operation Name",
        "description": "A detailed description of the operation.",
        "clause": "The corresponding VQL clause"
      },
      // ... other steps
    ]
  }

  Make sure that the returned JSON is correctly formatted and that each field is properly filled in. 
  Please generate explanation based on the keyword and in logical order.
  Only need to return the json and no other words additinally. 

  Your Task:
  Now please provide a detailed explanation in the same JSON format for the following specific VQL. begin with: JSON

  VQL:
  ${VQL}

  JSON:
  `

//   try {
//     const response = await axios.post(
//         `${openaiApiEndpoint}`,
//         {
//           model: "gpt-3.5-turbo-instruct",
//           prompt: prompt,
//           temperature: 1,
//           max_tokens: 2000,
//           top_p: 1,
//           frequency_penalty: 0,
//           presence_penalty: 0,
//         },
//         // {
//         //   model: "gpt-3.5-turbo",
//         //   messages: [
//         //     {
//         //       role: "system",
//         //       content: "You are a helpful assistant that formats explanations for VQL queries."
//         //     },
//         //     {
//         //       role: "user",
//         //       content: prompt
//         //     }
//         //   ],
//         //   temperature: 1,
//         //   max_tokens: 2000,
//         //   top_p: 1,
//         //   frequency_penalty: 0,
//         //   presence_penalty: 0,
//         // },
//         {
//           // proxy: {
//           //   protocol: "http",
//           //   host: "127.0.0.1",
//           //   port: 7890,
//           // },
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${openaiApiKey}`,
//           },
//       }
//     );
//   // console.log("Response explanation from OpenAI:", response.data.choices[0].text.trim());

//   const explanation = await parseJSONWithRetry(response.data.choices[0].text.trim());
//   console.timeEnd('POST /api/explain-vql Duration');
//   console.log("Parsed JSON Explanation:", explanation);
  
//   res.json(explanation);
// } catch (error) {
//   console.error('Error parsing JSON:', error.message);
//   res.status(500).json({ error: error.message });
// }
  try {
    const explanation = await callOpenAIWithRetry(prompt);
    console.timeEnd('POST /api/explain-vql Duration');
    console.log("Parsed JSON Explanation:", explanation);
    res.json(explanation);
  } catch (error) {
    console.error('Final error after retries:', error.message);
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});