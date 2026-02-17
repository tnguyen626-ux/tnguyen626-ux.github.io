const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  DeleteCommand,
  QueryCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "us-west-1" });
const db = DynamoDBDocumentClient.from(client);
const TABLE = "FitnessWorkouts";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const userId = event.queryStringParameters?.userId || body.userId;

    if (method === "GET") {
      const result = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId }
      }));
      return { statusCode: 200, headers, body: JSON.stringify(result.Items) };
    }

    if (method === "POST") {
      const workout = {
        userId,
        workoutId: String(body.id || Date.now()),
        date: body.date,
        type: body.type,
        duration: body.duration,
        distance: body.distance,
        notes: body.notes || ""
      };
      await db.send(new PutCommand({ TableName: TABLE, Item: workout }));
      return { statusCode: 200, headers, body: JSON.stringify({ message: "Workout saved", workout }) };
    }

    if (method === "DELETE") {
      await db.send(new DeleteCommand({
        TableName: TABLE,
        Key: { userId, workoutId: String(body.workoutId) }
      }));
      return { statusCode: 200, headers, body: JSON.stringify({ message: "Workout deleted" }) };
    }

    if (method === "OPTIONS") {
      return { statusCode: 200, headers, body: "" };
    }

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
