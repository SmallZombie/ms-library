declare module 'spark-md5' {
  const SparkMD5: {
    hash(str: string, raw?: boolean): string;
    hashBinary(content: string, raw?: boolean): string;
  };
  export default SparkMD5;
}
