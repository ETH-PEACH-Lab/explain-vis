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
    console.log('Database File Path:', databaseFile); // Debugging statement
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
            console.log('ddl', ddl);
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
      console.log('db', dbeg);
      return dbeg;
    }));
    exampleData += `${dbStr.join('')} \nQuestion: ${query}, \nVQL: ${g} \n`;
    console.log('expdata', exampleData);
  }

  return exampleData;
};


const composePrompt = async (data, question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id) => {
  let dbPrompt = data;
  let preText = 'Please generate VQL based on DDL table and question.';

  let exampleData = await searchExampleByQuestion(question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);
  question = '\nQuestion: ' + question + '\nVQL:';
  let prompt = `${preText} This is an example: \n${exampleData} Now, please generate VQL to answer this question based on json table. Generate VQL in one line and begin with : visualize\n${JSON.stringify(dbPrompt)}${question}`;
  return prompt;
};

app.post('/api/generate-vegalite', async (req, res) => {
  const { query, data } = req.body;
  console.log('Received POST request');
  console.log('Query:', query);
  console.log('Data:', data);

  const db_id = './utils/data/database'; // Set the db_id based on your directory structure
  const exampleEncoderQuestions = fs.readFileSync('./utils/data/train/train_encode.txt', 'utf-8').split('\n');
  const exampleDecoderAnswers = fs.readFileSync('./utils/data/train/train_decode_db.txt', 'utf-8').split('\n');
  const limitTable = 0;
  const nshot = 10;

  try {
    const prompt = await composePrompt(data, query, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);

    console.log('api', openaiApiKey);
    console.log('prompt', prompt);

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
        // proxy: {
        //   protocol: "http",
        //   host: "127.0.0.1",
        //   port: 7890,
        // },
      }
    );

    const generatedText = response.data.choices[0].text;
    console.log(generatedText)
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



app.post('/api/explain-vql', async (req, res) => {
  const { VQL } = req.body;
  const VQL_exp = 'VISUALIZE bar\\nSELECT date, AVG(price) FROM price\\nJOIN name ON price.id = name.id\\nWHERE (price > 150 AND price < 2000) OR year > 2000\\nGROUP BY date\\nORDER BY avg(price) DESC\\nBIN BY quarter'

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
        // {
        //   model: "gpt-3.5-turbo",
        //   messages: [
        //     {
        //       role: "system",
        //       content: "You are a helpful assistant that formats explanations for VQL queries."
        //     },
        //     {
        //       role: "user",
        //       content: prompt
        //     }
        //   ],
        //   temperature: 1,
        //   max_tokens: 2000,
        //   top_p: 1,
        //   frequency_penalty: 0,
        //   presence_penalty: 0,
        // },
        {
          // proxy: {
          //   protocol: "http",
          //   host: "127.0.0.1",
          //   port: 7890,
          // },
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
      }
    );
  console.log("Response explanation from OpenAI:", response.data.choices[0].text.trim());
  
  const explanation = JSON.parse(response.data.choices[0].text.trim());

  console.log("Parsed JSON Explanation:", explanation);
  
  res.json(explanation);
} catch (error) {
  console.error('Error parsing JSON:', error.message);
  res.status(500).json({ error: error.message });
}
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});