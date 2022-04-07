import AWS from 'aws-sdk';
import createError from 'http-errors';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export async function savePictureUrl(id, pictureUrl) {
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set pictureUrl = :pictureUrl',
        ExpressionAttributeValues: {
            ':pictureUrl': pictureUrl,
        },
        ReturnValues: 'ALL_NEW',
    }
    try {
        const result = await dynamoDb.update(params).promise();
        return result.Attributes;
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    
}
