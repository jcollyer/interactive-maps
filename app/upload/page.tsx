'use client'

import { useState } from 'react'
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";

export default function Page() {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  const Bucket = process.env.NEXT_PUBLIC_BUCKET_NAME;
  const Key = file?.name;
  const Body = file;

  const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
    }
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!file) {
      alert('Please select a file to upload.')
      return
    }

    setUploading(true)

    try {
      const parallelUploads3 = new Upload({
        client: s3Client,
        // tags: [...], // optional tags
        queueSize: 4, // optional concurrency configuration
        leavePartsOnError: false, // optional manually handle dropped parts
        params: { Bucket, Key, Body },
      });

      parallelUploads3.on("httpUploadProgress", (progress: Progress) => {
        console.log(progress);
      });

      await parallelUploads3.done();
    } catch (e) {
      console.log(e);
    }

    setUploading(false)
  }

  return (
    <main>
      <h1>Upload a File to S3</h1>
      <form onSubmit={handleSubmit}>
        <input
          id="file"
          type="file"
          onChange={(e) => {
            const files = e.target.files
            if (files) {
              setFile(files[0])
            }
          }}
          accept="image/png, image/jpeg"
        />
        <button type="submit" disabled={uploading}>
          Upload
        </button>
      </form>
    </main>
  )
}