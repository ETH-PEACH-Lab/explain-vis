const express = require("express");
const axios = require("axios");
const { constant } = require("vega");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT; 

app.use(express.json());

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error('OpenAI API key is missing. Please set it in the .env file.');
  process.exit(1); 
}

const openaiApiEndpoint = "https://api.openai.com/v1/completions";

app.post('/api/generate-vegalite', async (req, res) => {
  const { query, data } = req.body;

  // const prompt = `Generate a concise Vega-Lite json based on the following natural language query and data:\n\nQuery: "${query}"\n\nData: ${JSON.stringify(data)}\n return the whole json to render in vega editor.`;
  const prompt = `Given the following data and query, generate VQL and Vega-Lite specifications.
  This is an example: 
  data: ${JSON.stringify(data)}
  query: Show me a bar chart of the average prices grouped by quarter, including only the items where the price is greater than 150 and less than 2000, or the year is greater than 2000. The results should be ordered by price in descending order.
  
  VQL: VISUALIZE bar\\nSELECT date, price FROM price\\nJOIN name ON price.id = name.id\\nWHERE (price > 150 AND price < 2000) OR year > 2000\\nGROUP BY date\\nORDER BY avg(price)\\nDESC BIN BY quarter
  
  Vega-Lite: {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": {
      "values": [
        {"quarter":"2022-Q4","avg_price":2000},
        {"quarter":"2010-Q4","avg_price":1000}
      ]
    },
    "mark": "bar",
    "encoding": {
      "x": {"field": "quarter", "type": "ordinal", "title": "Quarter"},
      "y": {"field": "avg_price", "type": "quantitative", "title": "Average Price"},
      "color": {"field": "quarter", "type": "nominal", "title": "Quarter"},
      "tooltip": [
        {"field": "quarter", "type": "ordinal", "title": "Quarter"},
        {"field": "avg_price", "type": "quantitative", "title": "Average Price"}
      ]
    },
    "config": {
      "axis": {
        "labelFontSize": 12,
        "titleFontSize": 14
      }
    }
  }
  Note that color encoding can sometimes cause errors and is not necessary for all charts. Generally, color is used when grouping is involved.
  Note that If you want to display dates, consider using the temporal type.
  Ensure that the columns in the SELECT clause are explicitly mentioned instead of using *.
  Do not only follow the example provided! Some query dose not need the sub-vql like group, order, and bin. It just likes SQL. Please be simple!
  Please use \\n to mark line breaks in the VQL.

  Generate the VQL and Vega-Lite specifications to answer the following query and return VQL and Vega-lite specifications.
  
  query: ${query}
  VQL: [generated],
  Vega-Lite: [generated]
  `;

  try {
    const response = await axios.post(
      `${openaiApiEndpoint}`,
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

    const generatedText = response.data.choices[0].text;

    console.log('Response:', generatedText);    

    const VQLStart = generatedText.indexOf('VQL:') + 4;
    const VQLEnd = generatedText.indexOf('Vega-Lite:');
    const VQL = generatedText.substring(VQLStart, VQLEnd).trim();
    console.log('VQLStart:', VQLStart);
    console.log('VQLEnd:', VQLEnd);
    const vegaLiteSpecStart = generatedText.indexOf('{', VQLEnd);
    const vegaLiteSpecEnd = generatedText.lastIndexOf('}') + 1;
    const vegaLiteSpec = JSON.parse(generatedText.substring(vegaLiteSpecStart, vegaLiteSpecEnd));

    console.log('VQL:', VQL);
    console.log('vegaLiteSpec:', vegaLiteSpec);
    res.json({ VQL, vegaLiteSpec });
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
  const VQL_exp = 'VISUALIZE bar\nSELECT date, price FROM price\nJOIN name ON price.id = name.id\nWHERE (price > 150 AND price < 2000) OR year > 2000\nGROUP BY date\nORDER BY avg(price)\nDESC BIN BY quarter'

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
        "description": "Join the table price with the table name based on the id.",
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
        "description": "Group data by date and calculate the average price for each date.",
        "clause": "GROUP BY date"
      },
      {
        "step": 5,
        "operation": "ORDER BY",
        "description": "Order the results by average price in descending order.",
        "clause": "ORDER BY avg(price) DESC"
      },
      {
        "step": 6,
        "operation": "BIN BY",
        "description": "Bin the data by quarter.",
        "clause": "BIN BY quarter"
      },
      {
        "step": 7,
        "operation": "SELECT",
        "description": "Select the date and price columns.",
        "clause": "SELECT date, price"
      },
      {
        "step": 8,
        "operation": "VISUALIZE",
        "description": "Visualize the results as a bar chart.",
        "clause": "VISUALIZE bar"
      }]
  }
  const prompt = `You are a excellent software engineer or developer. I have an example of a VQL (Visual Query Language) and its corresponding explanation in a specific JSON format. Here is the example:

Example VQL:
\`\`\`
${VQL_exp}
\`\`\`

Example Explanation in JSON:
\`\`\`json
${JSON.stringify(explanation_exp, null, 2)}
\`\`\`

Your Task:
Please provide a detailed explanation in the same JSON format for the following VQL:

VQL:
\`\`\`
${VQL}
\`\`\`

Expected JSON Format:
\`\`\`json
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
\`\`\`

Make sure that the returned JSON is correctly formatted and that each field is properly filled in. Only need to return the json.`

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
