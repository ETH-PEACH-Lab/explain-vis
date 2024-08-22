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

Form Clause: Make sure that the FROM clause contains only one table.
JOIN Clause: Use only the JOIN ... ON format without specifying INNER, LEFT, RIGHT, or other types of joins.
When performing joins, use the table.column format. Do not rename or alias the table names (i.e., do not use the AS keyword).
Other Operations: For all other operations (e.g., SELECT, FROM, GROUP BY, ORDER BY, BIN BY), use only the column names without the table prefix.
SELECT Statement includes only column names or optional aggregate functions (e.g., avg, sum, count,max,min).
In a SELECT statement, the first value corresponds to the x-axis, and the second value corresponds to the y-axis.
The BIN BY options are: year, month, week, day, weekday, quarter.
GROUP BY and ORDER BY Clauses use only columns.
No Nested Queries: The VQL should be simple and straightforward without any nested SQL queries or subqueries.
No * Symbol: We avoid using * in VQL.
No inner ou
Format: Generate the VQL in a single line, starting with the keyword visualize.

please generate VQL to answer this question based on json table. 
\n${JSON.stringify(dbPrompt)}${question}`;
  return prompt;
};

function validateVQL(vql_init, tableSchema) {
  let vql = vql_init.replace(/\n/g, ' ');
  const validTypes = ['pie', 'scatter', 'line', 'bar'];
  const visualizeRegex = /^visualize\s+(pie|scatter|line|bar)/i;

  const hasAsterisk = /\*/.test(vql);
  if (hasAsterisk) {
    return 'Do not use the * symbol in VQL queries.';
  }

  if (!visualizeRegex.test(vql)) {
    return 'VQL must start with "visualize" followed by a valid type (e.g., pie, scatter, line, bar). Default type is scatter.';
  }

  const hasAlias = /\bAS\b/i.test(vql);
  if (hasAlias) {
    return 'Do not use the AS keyword for aliasing table names.';
  }

  const invalidJoinTypes = /\b(INNER|LEFT|RIGHT|FULL|OUTER|CROSS)\s+JOIN\b/i;
  if (invalidJoinTypes.test(vql)) {
    return 'Do not specify JOIN types (e.g., INNER, LEFT, RIGHT, FULL). Use only "JOIN ... ON".';
  }

  const joinRegex = /join\s+\w+\s+on\s+([\w.]+)\s*=\s*([\w.]+)/gi;
  let match;
  const joinErrors = [];

  // Validate ON conditions in JOIN clauses
  while ((match = joinRegex.exec(vql)) !== null) {
    const leftSide = match[1];
    const rightSide = match[2];

    if (!/^\w+\.\w+$/.test(leftSide)) {
      joinErrors.push(`Invalid ON condition: ${leftSide} must be in "table.column" format.`);
    }
    if (!/^\w+\.\w+$/.test(rightSide)) {
      joinErrors.push(`Invalid ON condition: ${rightSide} must be in "table.column" format.`);
    }
  }

  if (joinErrors.length > 0) {
    return `Validation failed: ${joinErrors.join(' ')}`;
  }

  const nonJoinRegex = /(select|where|group\s+by|order\s+by|bin\s+by)\s+[^\s]+\.\w+/i;

  // Check for table.column usage outside of JOIN clauses
  const matchNonJoin = vql.match(nonJoinRegex);
  if (matchNonJoin) {
    return 'Do not use table.column outside of JOIN clauses.';
  }

  // Extract and validate SELECT and FROM clauses
  const selectMatch = vql.match(/select\s+(.+?)\s+from/i);
  const fromMatch = vql.match(/from\s+(.+?)(\s+|$)/i);

  // Ensure SELECT and FROM clauses exist
  if (!selectMatch || !fromMatch) {
    return 'Unable to parse SELECT or FROM clauses. Both must be present.';
  }

  const selectElements = selectMatch[1].split(',').map(el => el.trim().split(' ')[0]);
  const fromTables = fromMatch[1].split(',').map(table => table.trim());

  // Check if more than one table is present in the FROM clause
  if (fromTables.length > 1) {
    return 'The FROM clause can only contain one table. Use JOIN to include multiple tables.';
  }

  const fromTable = fromTables[0];

  // Extract GROUP BY and BIN BY clauses
  const groupByMatch = vql.match(/group\s+by\s+(.+?)(\s+order\s+by|\s*$)/i);
  const binByMatch = vql.match(/bin\s+by\s+(.+?)(\s+group\s+by|\s+order\s+by|\s*$)/i);

  // Validate GROUP BY clause elements
  if (groupByMatch) {
    const groupByElements = groupByMatch[1].split(',').map(el => el.trim());

    for (const groupEl of groupByElements) {
      if (!selectElements.includes(groupEl) && 
          !(binByMatch && binByMatch[1].split(',').map(el => `binBy_${el.trim()}`).includes(groupEl)) && 
          !tableSchema[fromTable].includes(groupEl)) {
        return `GROUP BY element "${groupEl}" is not valid. It must be in SELECT, BIN BY, or a column from the table "${fromTable}".`;
      }
    }
  }

  // Validate BIN BY clause elements
  if (binByMatch) {
    const binByElements = binByMatch[1].split(',').map(el => `binBy_${el.trim()}`);

    for (const binEl of binByElements) {
      if (!selectElements.includes(binEl)) {
        return `BIN BY element "${binEl}" is not valid. It must be in SELECT.`;
      }
    }
  }

  // Check for nested queries
  const hasNestedQueries = /\(\s*SELECT\b/i.test(vql);
  if (hasNestedQueries) {
    return 'Avoid using nested queries.';
  }

  return ''; // Validation passed
}


function extractVisualizeVQL(vql) {
  const visualizeIndex = vql.indexOf('visualize');
  const issueIndex = vql.indexOf('issues');

  if (visualizeIndex !== -1 && issueIndex !== -1 && visualizeIndex < issueIndex) {
    // 提取从 "visualize" 开始到 "issue" 之前的部分，不包括前导空格
    return vql.slice(visualizeIndex, issueIndex).trimEnd();
  } else if (visualizeIndex !== -1 && (issueIndex === -1 || visualizeIndex < issueIndex)) {
    // 如果没有 "issue" 或 "visualize" 出现在 "issue" 之前，只提取从 "visualize" 开始的部分
    return vql.slice(visualizeIndex).trimEnd();
  } else {
    throw new Error('VQL must start with "visualize" followed by a valid type (e.g., pie, scatter, line, bar).');
  }
}


async function callOpenAIWithRetryforVQL(prompt, tableSchema, retries = 10, lastError = '', lastVQL = '', userId) {
  let generatedText = ''; // 确保 generatedText 变量被初始化

  try {
    if (lastError) {
      // 仅将当前VQL和错误信息附加到提示中
      prompt += `\nFailed VQL: ${lastVQL}\nIssues: ${lastError}`;
    }
    // 添加生成VQL的最终指示
    prompt += "\nPlease generate VQL in one line and begin with visualize";
    console.log('\nprompts',prompt)
    console.log('\nretries',retries)
    appendLogToFile(userId, `Prompt sent to OpenAI: ${prompt}`);
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

    generatedText = response.data.choices[0].text.trim(); // 确保 generatedText 被正确赋值
    generatedText = extractVisualizeVQL(generatedText)
    console.log('Generated VQL:', generatedText);
    appendLogToFile(userId, `Attempt ${10 - retries + 1} Generated VQL: ${generatedText}`);
    const validationError = validateVQL(generatedText, tableSchema);
    if (!validationError) {
      console.log('Validation Passed: VQL is valid.');
      appendLogToFile(userId, `Validation Passed: VQL is valid.`);
      return generatedText.toLowerCase();
    } else {
      appendLogToFile(userId, `Attempt ${10 - retries + 1}: Validation Failed: ${validationError}`);
      throw new Error(validationError);
    }
  } catch (error) {
    console.error('Error during OpenAI API call:', error.message);
    if (retries > 0) {
      // 仅附加当前生成的 VQL 和最新的错误信息
      const newVQL = generatedText ? generatedText : lastVQL;
      const newError = `${error.message}`; // 清理累积的错误信息
      console.log(`Retrying with additional instruction: ${newError} (${retries} attempts left)`);
      appendLogToFile(userId, `Retrying with additional instruction: ${newError} (${retries} attempts left)`);
      return callOpenAIWithRetryforVQL(prompt, tableSchema, retries - 1, newError, newVQL);
    } else {
      appendLogToFile(userId, 'Failed to generate valid VQL from OpenAI after multiple attempts');
      throw new Error('Failed to generate valid VQL from OpenAI after multiple attempts');
    }
  }
}

const logsDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDirectory)) {
  fs.mkdirSync(logsDirectory);
}

const appendLogToFile = (sessionId, logEntry) => {
  const logFilePath = path.join(logsDirectory, `${sessionId}.json`);

  let logs = [];

  // Check if the log file already exists
  if (fs.existsSync(logFilePath)) {
    // Read the existing logs
    const existingLogs = fs.readFileSync(logFilePath, 'utf-8');
    logs = JSON.parse(existingLogs);
  }

  if (typeof logEntry === 'string') {
    logEntry = { message: logEntry };
  }

  // Append the new log entry
  logs.push({
    serverTimestamp: new Date().toISOString(),  // Backend timestamp
    ...logEntry
  });

  // Write the updated logs back to the file
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));  // Pretty print with 2-space indentation
};

const appendFrontLogToFile = (sessionId, logEntry) => {
  const logFilePath = path.join(logsDirectory, `${sessionId}.json`);

  let logs = [];

  // Check if the log file already exists
  if (fs.existsSync(logFilePath)) {
    // Read the existing logs
    const existingLogs = fs.readFileSync(logFilePath, 'utf-8');
    logs = JSON.parse(existingLogs);
  }

  // Append the new log entry
  logs.push(logEntry);

  // Write the updated logs back to the file
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));  // Pretty print with 2-space indentation
};

app.post('/log', (req, res) => {
  const { sessionId, message } = req.body;

  const logEntry = {
    serverTimestamp: new Date().toISOString(),  // Add server timestamp here
    message,
  };

  appendFrontLogToFile(sessionId, logEntry);

  res.send('Log saved');
});


app.post('/api/generate-vegalite', async (req, res) => {
  console.time('GET * VQL Request Duration');
  const { query, data, userId } = req.body;
  // console.log('Received POST request');
  // console.log('Query:', query);
  // console.log('Data:', data);
  appendLogToFile(userId, `API Received query: ${query}`)
  const db_id = './utils/data/database'; // Set the db_id based on your directory structure
  const exampleEncoderQuestions = fs.readFileSync('./utils/data/train/train_encode.txt', 'utf-8').split('\n');
  const exampleDecoderAnswers = fs.readFileSync('./utils/data/train/train_decode_db.txt', 'utf-8').split('\n');
  const limitTable = 0;
  const nshot = 10;

  try {
    const prompt = await composePrompt(data, query, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);

    console.log('Generated Prompt:', prompt);
    appendLogToFile(userId, `API Generated Prompt: ${prompt}`)

    const generatedText = await callOpenAIWithRetryforVQL(prompt,data,10,userId);

    console.timeEnd('GET * VQL Request Duration');
    console.log('Generated VQL:', generatedText);
    appendLogToFile(userId, `API Generated VQL: ${generatedText}`);
    res.json({ VQL: generatedText });
  } catch (error) {
    console.error('Error:', error.message);
    appendLogToFile(userId, `Error: ${error.message}`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
      appendLogToFile(userId, `API Error Status: ${error.response.status}`);
      appendLogToFile(userId, `API Error Headers: ${JSON.stringify(error.response.headers)}`);
      appendLogToFile(userId, `API Error Data: ${JSON.stringify(error.response.data)}`);
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
      throw new Error('Failed to get valid JSON from OpenAI after multiple attempts. Please revise your query.');
    }
  }
}

app.post('/api/explain-vql', async (req, res) => {
  console.time('POST /api/explain-vql Duration');
  const { VQL, tableSchema, userId } = req.body;

  appendLogToFile(userId, `API Received VQL: ${VQL}`);

  const VQL_exp = 'VISUALIZE bar\nSELECT date, AVG(price)\nFROM price\nJOIN name ON price.id = name.id\nWHERE (price > 150 AND price < 2000) OR year > 2000\nGROUP BY date\nORDER BY avg(price) DESC\nBIN BY quarter'

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

  Note you should better generate the explanation referred with this order of operations and the description format for each operation.

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
  When describing statement, include the specific column names involved,
  Only need to return the json and no other words additinally. 

  Your Task:
  Now please provide a detailed explanation in the same JSON format for the following specific VQL. begin with: JSON

  VQL:
  ${VQL}

  JSON:
  `

  try {
        const validationError = validateVQL(VQL, tableSchema);
        if (!validationError) {
          console.log('Validation Passed: VQL is valid.');
          appendLogToFile(userId, `API Input VQL is valid.`);
          
          const explanation = await callOpenAIWithRetry(prompt);
          console.timeEnd('POST /api/explain-vql Duration');
          console.log("Parsed JSON Explanation:", explanation);
          appendLogToFile(userId, `API Generated Explanation: ${JSON.stringify(explanation)}`);

          res.json(explanation);
        } else {
          appendLogToFile(userId, `API Input VQL Validation Failed: ${validationError}`);
          throw new Error(validationError);
        }
  } catch (error) {
    console.error('Final error after retries:', error.message);
    appendLogToFile(userId, `Final error after retries: ${error.message}`);

    if (error.response) {
      appendLogToFile(userId, `API Error Status: ${error.response.status}`);
      appendLogToFile(userId, `API Error Headers: ${JSON.stringify(error.response.headers)}`);
      appendLogToFile(userId, `API Error Data: ${JSON.stringify(error.response.data)}`);
    }
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});