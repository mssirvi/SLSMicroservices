import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import { getAuctionById } from './getAuction';
import validator from '@middy/validator';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
    let updatedAuction;
    const { id } = event.pathParameters;
    const { amount } = event.body;
    const { email } = event.requestContext.authorizer;
    const getAuction = await getAuctionById(id);

    if(amount <= getAuction.highestBid.amount) {
        throw new createError.Forbidden(`Your bid must be higher than "${getAuction.highestBid.amount}"`)
    }
    if(getAuction.status !== 'OPEN' ){
        throw new createError.Forbidden("you cannot bid on closed auctions!");
    }
    if(getAuction.highestBid.bidder === email) {
        throw new createError.Forbidden("You cannot bid twice on highest bid!");
    }
    if(email === getAuction.seller) {
        throw new createError.Forbidden("You cannot bid on your own auction!");
    }
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email,
        },
        ReturnValues: 'ALL_NEW',
    }

    try {
        const result = await dynamoDb.update(params).promise();
        updatedAuction = result.Attributes;
    } catch (error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }

    // if (!updatedAuction) {
    //     throw new createError.NotFound(`Auction with ID "${id}" not found!`)
    // }
    return {
        statusCode: 200,
        body: JSON.stringify({ updatedAuction }),
    };
}

export const handler = commonMiddleware(placeBid)
.use(
    validator({
      inputSchema: placeBidSchema,
      ajvOptions: {
        strict: false,
      },
    })
  );;