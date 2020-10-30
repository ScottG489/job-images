import date from 'date-and-time'
import S3 from 'aws-sdk/clients/s3'
import {readFileSync} from "fs";
import {FileMetadata, FileMetadataAbbr} from "./types";

const secretsFile = "/run/build/secrets/secrets";
const secrets = JSON.parse(readFileSync(secretsFile, 'utf8'));
const awsAccessKeyId = secrets.ACCESS_KEY_ID
const awsSecretAccessKey = secrets.SECRET_ACCESS_KEY

const S3_TAKEOUT_BUCKET_NAME = 'gdrive-takeout';

(async () => {
    const s3: S3 = new S3({
        credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey
        }
    })

    const gdriveTakeoutList: any = await s3.listObjectsV2({
            Bucket: S3_TAKEOUT_BUCKET_NAME
        }
    ).promise()

    const latestFileName = gdriveTakeoutList.Contents.map((fileMetadata: FileMetadata) => {
        return {
            key: fileMetadata.Key,
            createdDateTime: parseDateFrom(fileMetadata.Key)
        }
    })
        .sort(fileMetadataAbbrComparator)
        .pop().key

    const options = {
        Bucket: S3_TAKEOUT_BUCKET_NAME,
        Key: latestFileName,
    };

    let resp = await s3.getObject(options).promise();
    console.log(resp.Body?.toString('base64'))

    // let fileStream = s3.getObject(options).createReadStream();
    // let writeStream = fs.createWriteStream(latestFileName);
    // fileStream.pipe(writeStream);
})().catch(e => {
    console.log("Fail")
    console.log(e);
});

function parseDateFrom(fileName: string): Date {
    const createdDateTime = fileName.split('-')[1]
    return date.parse(createdDateTime, 'YYYYMMDDTHHmmss ', true);
}

function fileMetadataAbbrComparator(file1: FileMetadataAbbr, file2: FileMetadataAbbr): number {
    return file1.createdDateTime.getTime() - file2.createdDateTime.getTime()
}
