export interface FileMetadata {
    Key: string;
    LastModified: string;
    ETag: string;
    Size: number;
    StorageClass: string;
}

export interface FileMetadataAbbr {
    key: string;
    createdDateTime: Date;
}

