import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import validator from '@middy/validator';
import getAuctionsSchema from '../lib/schemas/getAuctionsSchema';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function GetAuctions(event, context) {
    let auctions;
    const { status } = event.queryStringParameters;
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
            ':status': status,
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
    };
    try {
        const result = await dynamoDb.query(params).promise();
        auctions = result.Items;
    } catch (error) {
        console.log(error);
        throw new createError.InternalServerError(error);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ auctions }),
    };
}

export const handler = commonMiddleware(GetAuctions)
.use(
    validator({
      inputSchema: getAuctionsSchema,
      ajvOptions: {
        useDefaults: true,
        strict: false,
      },
    })
  );