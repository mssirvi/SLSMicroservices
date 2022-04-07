import middy from '@middy/core';
import httpJsonBodyparser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';

export default handler => middy(handler)
    .use([
        httpErrorHandler(),
        httpEventNormalizer(),
        httpJsonBodyparser()
    ]);