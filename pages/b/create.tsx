'use client'

import { useEffect, useState, MouseEvent } from 'react'
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";
import { Loader } from '@googlemaps/js-api-loader';

export default function Page() {
  const [file, setFile] = useState<File | undefined>(undefined)
  const [uploading, setUploading] = useState(false)

  const [buildingAddress, setBuildingAddress] = useState("");
  const [buildingAltName, setBuildingAltName] = useState("");
  const [buildingImage, setBuildingImage] = useState("");
  const [buildingLat, setBuildingLat] = useState("");
  const [buildingLng, setBuildingLng] = useState("");
  const [publish, setPublish] = useState(false);

  const create = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const body = { buildingAddress, buildingAltName, buildingImage, buildingLat, buildingLng, publish };
      await fetch("/api/building/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const Bucket = "collyerdesign-recovery";
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


  const searchLatAndLngByStreet = (street: string) => {

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': street }, (res, status) => {
      console.log(res, status)
      if (status == google.maps.GeocoderStatus.OK && res) {
        console.log({
          latitude: JSON.stringify(res[0].geometry.location.lat()),
          longitude: JSON.stringify(res[0].geometry.location.lng())
        })
      }
    });
  }

  useEffect(() => {
    const getGeo = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
        version: 'quartely',
      });

      // Load the geocode library
      await loader.importLibrary('geocoding') as google.maps.GeocodingLibrary;
    };
    getGeo(), []
  });

  return (
    <main>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <input onChange={(e) => searchLatAndLngByStreet(e.target.value)} />
        <h1 className="font-semibold text-lg mb-10">Upload a File to S3</h1>
        {uploading && <p>Uploading...</p>}
        <form className="flex flex-col space-y-4">
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
          <div>
            <label htmlFor="building-address">Address</label>
            <input
              className="border border-gray-300 p-1 rounded ml-2"
              id="building-address"
              type="text"
              value={buildingAddress}
              onChange={(e) => setBuildingAddress(e.target.value)}
              placeholder="building address"
              required
            />
          </div>
          <div>
            <label htmlFor="building-altName">Alternative Name</label>
            <input
              className="border border-gray-300 p-1 rounded ml-2"
              id="building-altName"
              type="text"
              value={buildingAltName}
              onChange={(e) => setBuildingAltName(e.target.value)}
              placeholder="building altName"
              required
            />
          </div>
          <div>
            <div>
              <label htmlFor="building-image">building Image</label>
              <input
                className="border border-gray-300 p-1 rounded ml-2"
                id="building-image"
                type="text"
                value={buildingImage}
                onChange={(e) => setBuildingImage(e.target.value)}
                placeholder="building image"
                required
              />
            </div>
          </div>
          <div>
            <div>
              <label htmlFor="building-lat">building Lat</label>
              <input
                className="border border-gray-300 p-1 rounded ml-2"
                id="building-lat"
                type="number"
                value={buildingLat}
                onChange={(e) => setBuildingLat(e.target.value)}
                placeholder="building lat"
                required
              />
            </div>
          </div>
          <div>
            <div>
              <label htmlFor="building-lng">building Lng</label>
              <input
                className="border border-gray-300 p-1 rounded ml-2"
                id="building-lng"
                type="number"
                value={buildingLng}
                onChange={(e) => setBuildingLng(e.target.value)}
                placeholder="building lng"
                required
              />
            </div>
          </div>
          <div>
            <label>
              <input
                className="mr-2"
                type="checkbox"
                checked={publish}
                onChange={(e) => {
                  e.preventDefault();
                  setPublish(!publish);
                }}
              />
              <span>Publish Immediately?</span>
            </label>
          </div>
          <div>
            <div className="flex gap-4">
              <button type="submit" onClick={(e) => create(e)} disabled={uploading} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Submit</button>
              <button onClick={() => console.log("cancel")} type="button">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}