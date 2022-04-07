import { getAuctionById } from './getAuction';
import { uploadPictureToS3 } from '../lib/uploadPictureToS3';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import validator from '@middy/validator';
import createError from 'http-errors';
import { savePictureUrl } from '../lib/savePictureUrl';
import uploadAuctionPictureSchema from '../lib/schemas/uploadAuctionPictureSchema';

export async function uploadAuctionPicture(event) {
    const { id } = event.pathParameters;
    const { email } = event.requestContext.authorizer;
    const auction = await getAuctionById(id);
    if (email !== auction.seller) {
        throw new createError.Forbidden("You are forbidden to perform this action");
    }
    const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');

    let updateAuction;
    try {
        const pictureUrl = await uploadPictureToS3(auction.id + '.jpg', buffer)
        //save to dynamoDb
        console.log(pictureUrl);
        updateAuction = await savePictureUrl(id, pictureUrl);
    } catch(error) {
        console.error(error);
        throw new createError.InternalServerError(error);
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify({updateAuction}),
    };
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler())
    .use(
        validator({
          inputSchema: uploadAuctionPictureSchema,
          ajvOptions: {
            strict: false,
          },
        })
      );