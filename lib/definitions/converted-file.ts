export type SuccessfullyConvertedFile = {
    name: string;
    url: string;
};
export type FailedConvertedFile = {
    name: string;
    error: string;
};
export type ConvertedFile = SuccessfullyConvertedFile | FailedConvertedFile;