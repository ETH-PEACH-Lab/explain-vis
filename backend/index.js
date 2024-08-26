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

function transformVQL(vql) {
    // Step 1: Normalize spaces
    let transformedVQL = vql.replace(/\s+/g, ' ').trim();

    // Step 2: Handle table aliases
    const aliasRegex = /(\w+)\s+as\s+(\w+)/gi;
    let aliases = {};
    transformedVQL = transformedVQL.replace(aliasRegex, (match, table, alias) => {
        aliases[alias] = table;
        return table;  // Replace the alias with the table name
    });

    // Step 3: Replace COUNT(*) with COUNT(first_column)
    const selectRegex = /SELECT\s+([^,]+?)(?=\s*,|\s+FROM)/i;
    let firstColumn = '';
    const selectMatch = transformedVQL.match(selectRegex);
    if (selectMatch && selectMatch[1]) {
        firstColumn = selectMatch[1].trim().split('.').pop();
        transformedVQL = transformedVQL.replace(/COUNT\(\*\)/gi, `COUNT(${firstColumn})`);
    }

    // Step 4: Handle JOIN clause - Replace alias.column with table.column and ensure it's correctly applied
    const joinRegex = /join\s+(\w+)\s+on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
    transformedVQL = transformedVQL.replace(joinRegex, (match, table2, alias1, column1, alias2, column2) => {
        const table1 = aliases[alias1] || alias1;
        const table2Full = aliases[alias2] || alias2;
        return `JOIN ${table2} ON ${table1}.${column1} = ${table2Full}.${column2}`;
    });

    // Step 5: Remove table prefixes in SELECT, GROUP BY, and ORDER BY clauses
    transformedVQL = transformedVQL.replace(/\b(\w+)\.(\w+)\b/gi, (match, table, column) => {
        // Check if this is part of the JOIN clause and should be kept
        const joinClauseCheck = new RegExp(`join\\s+${table}\\b`, 'i').test(transformedVQL) || new RegExp(`on\\s+${table}\\b`, 'i').test(transformedVQL);
        if (joinClauseCheck) {
            return match;  // Keep table.column in JOIN clause
        } else {
            return column;  // Remove table prefix from other clauses
        }
    });

    return transformedVQL;
}



// // Test Case
// const vql = `visualize bar select document_name , count(*) from paragraphs as t1 join documents as t2 on t1.document_id = t2.document_id group by t1.document_id order by count(*) asc`;
// console.log(transformVQL(vql));


// // Test Case
// const vql1 = `visualize bar select party.party , count(party.party) from election join party on election.party = party.party_id group by party.party order by party.party asc`;
// console.log(transformVQL(vql1));




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
    g = transformVQL(g)
    // console.log('hhhhhhhhhhhhhhhhhhhhhhhhh',g)
    let tableNames = [...new Set([...g.matchAll(/ FROM\s+([^\s,(]+)/gi), ...g.matchAll(/ JOIN\s+([^\s,]+)/gi)].map(m => m[1].replace(/[()]/g, '')))];
    let dbStr = await Promise.all(tableNames.filter(t => !tables.includes(t)).map(async t => {
      tables.push(t);
      const dbeg = await getSchema(db, db_id, [t], query, limitTable);
      // console.log('db', dbeg);
      return dbeg;
    }));
    exampleData += `${dbStr.join('\n')} \nQuestion: ${query}, \nVQL: ${g} \n`;
    // console.log('expdata', exampleData);
  }

  return exampleData;
};


const composePrompt = async (data, question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id) => {
  let dbPrompt = data.ddl;
  let preText = 'Please generate VQL based on DDL table and question.';

  let exampleData = await searchExampleByQuestion(question, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);
  question = '\nQuestion: ' + question + '\nVQL:';
  let prompt = `${preText} This is an example: \n${exampleData} Now, 
  You are an expert in generating Visual Query Language (VQL) queries based on given data structures and questions. Please follow these guidelines:

Form Clause: Make sure that the FROM clause contains only one table.
JOIN Clause: Use only the "JOIN table ON table.column = table.column" format without specifying INNER, LEFT, RIGHT, or other types of joins.
You can only use one join, no join three table, no DISTINCT string
the table on the left of JOIN ON acts like a left join, focusing on its records first, while the table on the right provides matching data, similar to a right join.
Do not rename or alias the table names (i.e., do not use the AS keyword, do not use table t).
Other Operations: For all other operations (e.g., SELECT, FROM, GROUP BY, ORDER BY, BIN BY), use only the column names without the table prefix.
SELECT Statement includes only column names or optional aggregate functions (e.g., avg, sum, count,max,min).
In a SELECT statement, the first value corresponds to the x-axis, and the second value corresponds to the y-axis.
The BIN BY options are: year, month, week, day, weekday, quarter.
GROUP BY and ORDER BY Clauses use only columns.
No Nested Queries: The VQL should be simple and straightforward without any nested SQL queries or subqueries.
No * Symbol: We avoid using * in VQL.

Format: Generate the VQL in a single line, starting with the keyword visualize.

please generate VQL to answer this question based on json table. 
\n${JSON.stringify(dbPrompt)}${question}`;
  return prompt;
};

function validateVQL(vql_init, tableSchema) {
  let vql = vql_init.replace(/\n/g, ' ');
  const validTypes = ['pie', 'scatter', 'line', 'bar'];
  const visualizeRegex = /^visualize\s+(pie|scatter|line|bar)/i;

  // Check for forbidden keywords
  const forbiddenKeywords = ['INNER', 'LEFT', 'RIGHT', 'DISTINCT'];
  for (let keyword of forbiddenKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(vql)) {
      return `Do not use "${keyword}".`;
    }
  }

  // Check for nested queries
  const hasNestedQueries = /\(\s*SELECT\b/i.test(vql);
  if (hasNestedQueries) {
    return 'Avoid using nested queries.';
  }


  // 提取 JOIN ... ON ... 直到下一个关键字
  const joinOnRegex = /join\s+(.*?)\s+on\s+(.*?)(?=\b(select|from|where|group|order|bin|visualize)\b|$)/gi;
  let joinErrors = [];
  const tableNames = tableSchema.tableNames || []; // 提取 schema 中的 tableNames

  let match;
  while ((match = joinOnRegex.exec(vql)) !== null) {
    const joinPart = match[1].trim(); // 提取 JOIN 和 ON 之间的部分
    const onCondition = match[2].trim(); // 提取 ON 条件部分

    // 确保 JOIN 后只有一个表
    const joinTables = joinPart.split(/[\s,]+/);
    if (joinTables.length !== 1) {
      joinErrors.push(`Invalid JOIN clause: Only one table should be specified after JOIN. Found: ${joinTables.join(' ')}`);
      continue;
    }

    // 确保 ON 存在
    if (!onCondition) {
      joinErrors.push('Invalid ON condition: ON condition is missing or undefined.');
      continue;
    }

    // 确保 ON 条件中存在 "="
    if (!onCondition.includes('=')) {
      joinErrors.push('Invalid ON condition: ON condition must include an "=" sign.');
      continue;
    }

    // 验证 ON 条件是否符合 "table.column = table.column" 格式
    const [leftSide, rightSide] = onCondition.split('=').map(part => part.trim());

    if (!/^\w+\.\w+$/.test(leftSide) || !/^\w+\.\w+$/.test(rightSide)) {
      joinErrors.push(`Invalid ON condition: ${onCondition} must be in "table.column = table.column" format, only use a join.`);
      continue;
    }

    // 验证表名是否在 tableSchema 中
    const leftTable = leftSide.split('.')[0];
    const rightTable = rightSide.split('.')[0];

    if (!tableNames.includes(leftTable)) {
      joinErrors.push(`Invalid table name in ON condition: ${leftTable} is not in the schema.`);
    }
    if (!tableNames.includes(rightTable)) {
      joinErrors.push(`Invalid table name in ON condition: ${rightTable} is not in the schema.`);
    }
  }

  if (joinErrors.length > 0) {
    return `Validation failed: ${joinErrors.join(' ')}`;
  }

  // 移除 JOIN 子句
  const vqlWithoutJoins = vql.replace(joinOnRegex, '');

  // 验证 JOIN 之外的 table.column 使用
  const nonJoinRegex = /(\w+)\.(\w+)/g;
  const matchNonJoin = vqlWithoutJoins.match(nonJoinRegex);

  if (matchNonJoin) {
    return 'Do not use table.column outside of JOIN ... ON clause. Detected: ' + matchNonJoin.join(', ');
  }


  const hasAsterisk = /\*/.test(vql);
  if (hasAsterisk) {
    return 'Do not use the * symbol in VQL queries.';
  }

  const hasAlias = /\bAS\b/i.test(vql);
  if (hasAlias) {
    return 'Do not use the AS keyword for aliasing table names.';
  }

  // 提取 FROM 子句，直到下一个关键字
  const fromRegex = /from\s+(.*?)(?=\b(select|group|where|join|order|bin|visualize)\b|$)/i;
  const fromMatch = vql.match(fromRegex);

  if (fromMatch) {
    const fromPart = fromMatch[1].trim();

    // 确保 FROM 后只有一个表
    const fromTables = fromPart.split(/[\s,]+/);
    if (fromTables.length !== 1) {
      return `Invalid FROM clause: Only one table should be specified after FROM. Found: ${fromTables.join(' ')}`;
    }

    const fromTable = fromTables[0].trim();

    // 验证 FROM 子句中的表名是否在 tableSchema 中
    if (!tableNames.includes(fromTable)) {
      return `Invalid table name in FROM clause: ${fromTable} is not in the schema.`;
    }
  } else {
    return 'Unable to parse FROM clause. It must be present.';
  }

  const validBinByOptions = ['year', 'month', 'week', 'day', 'weekday', 'quarter'];
  const validSortingOrders = ['asc', 'desc'];

  // Validate BIN BY clause
  const binByRegex = /\bbin\s+by\s+(\w+)(?=\b(select|from|where|join|order\s+by|group\s+by|visualize)\b|$)/i;
  const binByMatch = vql.match(binByRegex);

  if (binByMatch) {
    const binByValue = binByMatch[1].trim();
    if (!validBinByOptions.includes(binByValue)) {
      return `Invalid BIN BY clause: "${binByValue}" is not a valid option. Allowed options are: ${validBinByOptions.join(', ')}.`;
    }
  } else {
    const invalidBinByRegex = /\bbin\s*[^b]*\s*by\b/i;
    if (invalidBinByRegex.test(vql)) {
      return 'Invalid BIN BY clause format: BIN BY should be a continuous clause with one valid option (e.g., BIN BY month).';
    }
  }

  const orderIndex = vql.indexOf('order');
    if (orderIndex !== -1) {
        const wordsAfterOrder = vql.slice(orderIndex).trim().split(/\s+/);

        // Check if the word immediately after 'order' is 'by'
        if (wordsAfterOrder[1] !== 'by') {
            return 'Invalid ORDER BY clause format: "BY" is missing after "ORDER".';
        }
    }

  // Extract and validate SELECT and FROM clauses
  const selectMatch = vql.match(/select\s+(.+?)\s+from/i);

  // Ensure SELECT and FROM clauses exist
  if (!selectMatch || !fromMatch) {
    return 'Unable to parse SELECT or FROM clauses. Both must be present.';
  }

  const selectElements = selectMatch[1].split(',').map(el => el.trim().split(' ')[0]);
  const fromTables = fromMatch[1].split(',').map(table => table.trim());

  
  const fromTable = fromTables[0];

  // // Extract GROUP BY and BIN BY clauses
  // const groupByMatch = vql.match(/group\s+by\s+(.+?)(\s+order\s+by|\s*$)/i);
  // const binByMatch = vql.match(/bin\s+by\s+(.+?)(\s+group\s+by|\s+order\s+by|\s*$)/i);

  // // Validate GROUP BY clause elements
  // if (groupByMatch) {
  //   const groupByElements = groupByMatch[1].split(',').map(el => el.trim());

  //   for (const groupEl of groupByElements) {
  //     if (!selectElements.includes(groupEl) && 
  //         !(binByMatch && binByMatch[1].split(',').map(el => `binBy_${el.trim()}`).includes(groupEl)) && 
  //         !tableSchema[fromTable].includes(groupEl)) {
  //       return `GROUP BY element "${groupEl}" is not valid. It must be in SELECT, or a column from the table "${fromTable}".`;
  //     }
  //   }
  // }

  // // Validate BIN BY clause elements
  // const validBinByOptions = ['year', 'month', 'week', 'day', 'weekday', 'quarter'];

  // if (binByMatch) {
  //   const binByElements = binByMatch[1].split(',').map(el => `${el.trim()}`);

  //   for (const binEl of binByElements) {
  //     if (!validBinByOptions.includes(binEl)) {
  //       return `BIN BY element "${binEl}" is not valid. It must be in .`;
  //     }
  //   }
  // }


  // if (!visualizeRegex.test(vql)) {
  //   return 'VQL must start with "visualize" followed by a valid type (e.g., pie, scatter, line, bar). Default type is scatter.';
  // }

  return ''; // Validation passed
}


function extractVisualizeVQL(vql) {
  const visualizeIndex = vql.indexOf('visualize');
  const issueIndex = vql.indexOf('Issues');

  if (visualizeIndex !== -1 && issueIndex !== -1 && visualizeIndex < issueIndex) {
    // 提取从 "visualize" 开始到 "issue" 之前的部分，不包括前导空格
    return vql.slice(visualizeIndex, issueIndex).trimEnd();
  } else if (visualizeIndex !== -1 && (issueIndex === -1 || visualizeIndex < issueIndex)) {
    // 如果没有 "issue" 或 "visualize" 出现在 "issue" 之前，只提取从 "visualize" 开始的部分
    return vql.slice(visualizeIndex).trimEnd();
  } else {
    throw new Error('VQL must start with "visualize".');
  }
}


async function callOpenAIWithRetryforVQL(prompt, tableSchema, retries = 5, lastError = '', lastVQL = '', userId,logs) {
  let generatedText = ''; // 确保 generatedText 变量被初始化
  let attemptNumber = 5 - retries + 1
  
  try {
    if (retries < 5) {
      // 仅将当前VQL和错误信息附加到提示中
      prompt += `\nError VQL: ${lastVQL}\nIssues: ${lastError}`;
    }
    // 添加生成VQL的最终指示
    prompt += "\nPlease generate correct VQL in one line and begin with visualize";
    console.log('\nprompts',prompt)
    console.log('\nretries',retries)
    // appendLogToFile(userId, `Prompt sent to OpenAI: ${prompt}`);

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
    generatedText = transformVQL(generatedText)
    console.log('Generated VQL:', generatedText);
    // appendLogToFile(userId, `Attempt ${5 - retries + 1} Generated VQL: ${generatedText}`);
    const validationError = validateVQL(generatedText, tableSchema);
    if (!validationError) {
      console.log('Validation Passed: VQL is valid.');
      // appendLogToFile(userId, `Validation Passed: VQL is valid.`);
      logs.push({ attempt: 5 - retries + 1, prompt, VQL: generatedText, status: 'valid' }); // 记录成功生成的 VQL 和 prompt
      return generatedText.toLowerCase();
    } else {
      // appendLogToFile(userId, `Attempt ${5 - retries + 1}: Validation Failed: ${validationError}`);
      logs.push({ attempt: 5 - retries + 1, prompt, VQL: generatedText, error: validationError }); // 记录生成的 VQL 和验证错误
      throw new Error(validationError);
    }
  } catch (error) {
    console.error('Error during OpenAI API call:', error.message);
    logs.push({ attempt: 5 - retries + 1, prompt, error: error.message }); // 记录错误信息和 prompt
    if (retries > 0) {
      // 仅附加当前生成的 VQL 和最新的错误信息
      const newVQL = generatedText ? generatedText : lastVQL;
      const newError = `${error.message}`; // 清理累积的错误信息
      console.log(`Retrying with additional instruction: ${newError} (${retries} attempts left)`);
      // appendLogToFile(userId, `Retrying with additional instruction: ${newError} (${retries} attempts left)`);
      return callOpenAIWithRetryforVQL(prompt, tableSchema, retries - 1, newError, newVQL, userId,logs);
    } else {
      logs.push({ attempt: 5 - retries + 1, prompt, error: 'Failed to generate valid VQL after multiple attempts' });
      // appendLogToFile(userId, 'Failed to generate valid VQL from OpenAI after multiple attempts');
      throw new Error(`Failed to generate valid VQL from OpenAI after 5 attempts.`);
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
  let { query, data, userId } = req.body;
  
  const db_id = './utils/data/database'; 
  const exampleEncoderQuestions = fs.readFileSync('./utils/data/train/train_encode.txt', 'utf-8').split('\n');
  const exampleDecoderAnswers = fs.readFileSync('./utils/data/train/train_decode_db.txt', 'utf-8').split('\n');
  const limitTable = 0;
  const nshot = 3;
  let logs = []; 
  

  try {
    const prompt = await composePrompt(data, query, exampleEncoderQuestions, exampleDecoderAnswers, limitTable, nshot, db_id);

    console.log('Generated Prompt:', prompt);
    
    const generatedText = await callOpenAIWithRetryforVQL(prompt,data.data,5,'','',userId,logs);

    console.timeEnd('GET * VQL Request Duration');
    console.log('Generated VQL:', generatedText);
    res.json({ VQL: generatedText, logs  });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    res.status(500).json({ error: error.message, logs });
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

function extractOperationsFromVQL(VQL) {
  // Define the list of valid operations
  const validOperations = ['SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'BIN BY', 'VISUALIZE'];

  // Extract operations by checking each line of the VQL
  const operationsInVQL = new Set();
  VQL.split('\n').forEach(line => {
    for (let operation of validOperations) {
      if (line.trim().toUpperCase().startsWith(operation)) {
        operationsInVQL.add(operation);
        break;
      }
    }
  });

  return operationsInVQL;
}

function validateExplanation(explanation, operationsInVQL) {
  const keywords = [
    'VISUALIZE', 'SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'BIN BY'
  ];

  if (!explanation || typeof explanation !== 'object' || !Array.isArray(explanation.explanation)) {
    return 'The explanation format is incorrect or missing the explanation array.';
  }

  for (let step of explanation.explanation) {
    if (!step.operation) {
      return `Missing operation field in explanation step: ${JSON.stringify(step)}`;
    }
    if (!step.clause) {
      return `Missing clause field in explanation step: ${JSON.stringify(step)}`;
    }
    if (!step.description) {
      return `Missing description field in explanation step: ${JSON.stringify(step)}`;
    }

    // Check if the operation exists in the VQL
    if (!operationsInVQL.has(step.operation.toUpperCase())) {
      return `The operation "${step.operation}" found in the explanation does not exist in the original VQL.`;
    }

    // Ensure the operation is within allowed keywords
    if (!keywords.includes(step.operation.toUpperCase())) {
      return `The operation "${step.operation}" is not recognized as a valid operation.`;
    }

    // Check if WHERE clause includes conditions
    if (step.operation.toUpperCase() === 'WHERE' && (!step.conditions || !Array.isArray(step.conditions) || step.conditions.length === 0)) {
      return 'WHERE clause does not include valid conditions.';
    }

    // Ensure FROM and JOIN are separate clauses
    if (step.operation.toUpperCase() === 'FROM' && explanation.explanation.some(s => s.operation.toUpperCase() === 'JOIN' && s.clause.includes(step.clause))) {
      return 'FROM and JOIN should be separate clauses.';
    }

    // Check if the clause contains more than one operation
    let operationCount = keywords.filter(keyword => step.clause.toUpperCase().includes(keyword)).length;
    if (operationCount > 1) {
      return `Clause "${step.clause}" should not contain more than one operation.`;
    }
  }


  // Return null if all validations pass
  return null;
}


async function callOpenAIWithRetry(prompt, VQL, explanationLogs, retries = 10, delay = 1000) {
  const operationsInVQL = extractOperationsFromVQL(VQL);

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
    let explanation = extractJSON(responseText);

    explanationLogs.push({ attempt: 10 - retries + 1, responseText, explanation });

    // Validate the extracted explanation
    const validationError = validateExplanation(explanation, operationsInVQL);
    if (explanation && !validationError) {
      return explanation;
    } else {
      throw new Error(`Validation failed: ${validationError}`);
    }
  } catch (error) {
    console.error('Error during processing:', error.message);
    explanationLogs.push({ attempt: 10 - retries + 1, error: error.message }); // 记录当前尝试的错误信息

    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      
      // Modify prompt to include validation error feedback
      const updatedPrompt = `${prompt}\n\nNote: Previous response failed validation due to the following reason:\n${error.message}. Please correct this in the new response.`;

      await new Promise(resolve => setTimeout(resolve, delay)); // Delay before retrying
      return callOpenAIWithRetry(updatedPrompt, VQL, explanationLogs, retries - 1, delay);
    } else {
      throw new Error('Failed to generate valid JSON from OpenAI after 10 attempts. Please revise your query.');
    }
  }
}

function formatVQL(vql) {
  // Define the list of keywords, operators, and functions to insert a newline before and to uppercase
  const keywords = [
      'VISUALIZE', 'SELECT', 'FROM', 'JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'BIN BY'
  ];

  const operators = [
      'AND', 'OR', 'NOT','ON', 'BETWEEN', 'IN', 'LIKE', 'IS', '=', '!=', '<>', '<', '<=', '>', '>=',
      '\\+', '-', '\\*', '/', '%', '\\^', '&&', '\\|\\|', '!', 'ASC', 'DESC'
  ];

  const functions = [
      'SUM', 'AVG', 'COUNT', 'MIN', 'MAX'
  ];

  // Combine all for the regex
  const allTerms = [...keywords, ...operators, ...functions];

  // Regular expression to match keywords, operators, and functions, with word boundaries and case-insensitive flag
  const regex = new RegExp(`\\b(${allTerms.join('|')})\\b`, 'gi');

  let VQL = vql.replace(/\n/g, ' ');
  // Replace the matched keywords, operators, and functions with uppercase, and insert the escaped newline for keywords
  return VQL.replace(regex, (match) => {
      if (keywords.includes(match.toUpperCase())) {
          return `\n${match.toUpperCase()}`;
      } else {
          return match.toUpperCase();
      }
  }).trim();
}

app.post('/api/explain-vql', async (req, res) => {
  console.time('POST /api/explain-vql Duration');
  let { VQL, tableData, userId } = req.body;
  tableData = tableData.data
  VQL = formatVQL(VQL)
  let explanationLogs = [];
  // console.log('111',`${tableData}`)
  // appendLogToFile(userId, `API Received VQL: ${VQL}`);
  explanationLogs.push({ message: `API Received VQL: ${VQL}`, status: 'Received' });
  const VQL_exp = 'VISUALIZE bar\nSELECT date, AVG(price)\nFROM price\nJOIN name ON price.id = name.id\nWHERE (price > 150 AND price < 2000) OR year > 2000\nGROUP BY date\nORDER BY avg(price) DESC\nBIN BY quarter'

  const explanation_exp={
    "VQL": VQL_exp,
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
    "VQL": "VQL", // keep the same with whole VQL
    "explanation": [
      {
        "step": "execution order",
        "operation": "Operation Name",
        "description": "A detailed description of the operation.",
        "clause": "The corresponding VQL clause"
      },
      // ... other steps, where steps must include conditions[{}] enven if it is one condition
    ]
  }

  Make sure that the returned JSON is correctly formatted and that each field is properly filled in. 
  Please generate explanation based on the keyword and in logical order.
  valid clauses using the valid operations: SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY, BIN BY, VISUALIZE.
  Each clause typically begins with a specific operation name. Note From operation should seperate from JOIN operation
  Operations that aren't involved in whole VQL, don't need to be included in explanation, don not use operation ''.
  When describing statement, include the specific column names involved.
  Only need to return the json and no other words additinally. 
  Please not change the whole VQL, add up all clause should be the same with VQL.
  When the VQL is broken just break it dowm based on its operation, don't change the pattern and value in VQL.
  If the visualize type missed, must keep the same in visualize operation clause 'visualize' or just empty '' and only in description mention 'default type'.
  
  Your Task:
  Now please provide a detailed explanation in the same JSON format for the following specific VQL. begin with: JSON

  VQL:
  ${VQL}

  JSON:
  `

  try {
        const validationError = validateVQL(VQL, tableData);
        
        if (!validationError) {
          console.log('Validation Passed: VQL is valid.',VQL);
          // appendLogToFile(userId, `API Input VQL is valid.`);
          
          const explanation = await callOpenAIWithRetry(prompt,VQL,explanationLogs);
          console.timeEnd('POST /api/explain-vql Duration');
          console.log("Parsed JSON Explanation:", explanation);
          // appendLogToFile(userId, `API Generated Explanation: ${JSON.stringify(explanation)}`);

          res.json({ explanation, logs: explanationLogs });
        } else {
          // appendLogToFile(userId, `API Input VQL Validation Failed: ${validationError}`);
          throw new Error(validationError);
        }
  } catch (error) {
    console.error('Final error after retries:', error.message);
    // appendLogToFile(userId, `Final error after retries: ${error.message}`);
    explanationLogs.push({ message: error.message, status: 'Error' });
    // if (error.response) {
      // appendLogToFile(userId, `API Error Status: ${error.response.status}`);
      // appendLogToFile(userId, `API Error Headers: ${JSON.stringify(error.response.headers)}`);
      // appendLogToFile(userId, `API Error Data: ${JSON.stringify(error.response.data)}`);
    // }
    res.status(500).json({ error: error.message, logs: explanationLogs });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});