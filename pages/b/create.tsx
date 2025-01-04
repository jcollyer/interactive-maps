'use client'

import { useCallback, useEffect, useState, useRef, MouseEvent } from 'react'
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";
import { Loader } from '@googlemaps/js-api-loader';
import { useDropzone } from 'react-dropzone'

export default function Page() {
  const mapPreviewRef = useRef<HTMLDivElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false)
  const [buildingAddress, setBuildingAddress] = useState("");
  const [buildingAltName, setBuildingAltName] = useState("");
  const [buildingImageUrl, setBuildingImageUrl] = useState("");
  const [buildingLat, setBuildingLat] = useState("");
  const [buildingLng, setBuildingLng] = useState("");

  const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleSubmitImage(acceptedFiles[0])
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  const handleSubmitImage = async (image: File) => {
    setUploadingImage(true)

    try {
      const parallelUploads3 = new Upload({
        client: s3Client,
        // tags: [...], // optional tags
        queueSize: 4, // optional concurrency configuration
        leavePartsOnError: false, // optional manually handle dropped parts
        params: { Bucket: "collyerdesign-recovery", Key: image.name, Body: image },
      });

      parallelUploads3.on("httpUploadProgress", (progress: Progress) => {
        console.log(progress);
      });

      const response = await parallelUploads3.done();
      setBuildingImageUrl(response.Location || "");
      return response.Location;
    } catch (e) {
      console.log(e);
    } finally {
      setUploadingImage(false)
    }
  }

  const searchLatAndLngByStreet = (street: string) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ 'address': street }, (res, status) => {
      console.log(res, status)
      if (status == google.maps.GeocoderStatus.OK && res) {
        setBuildingLat(JSON.stringify(res[0].geometry.location.lat()));
        setBuildingLng(JSON.stringify(res[0].geometry.location.lng()));
      }
    });
  }

  const createBuilding = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      const body = { address: buildingAddress, altName: buildingAltName, image: buildingImageUrl, lat: Number(buildingLat), lng: Number(buildingLng), publish: true };
      await fetch("/api/building/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setBuildingAddress("");
      setBuildingAltName("");
      setBuildingImageUrl("");
      setBuildingLat("");
      setBuildingLng("");
    }
  };

  useEffect(() => {
    const getGeo = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
        version: 'quartely',
      });

      // Load the geocode library
      await loader.importLibrary('geocoding') as google.maps.GeocodingLibrary;
      // Load the map library
      const { Map } = await loader.importLibrary('maps');
      // Load the marker library
      await loader.importLibrary('marker') as google.maps.MarkerLibrary;


    };
    getGeo(), []
  });

  const loadPreviewMap = async () => {
    const locationInMap = { lat: Number(buildingLat), lng: Number(buildingLng) };
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY as string,
      version: 'quartely',
    });

    const { Map } = await loader.importLibrary('maps');
    const { AdvancedMarkerElement } = await loader.importLibrary("marker");
    const map = new Map(mapPreviewRef.current as HTMLDivElement, {
      center: locationInMap,
      zoom: 16,
      mapId: 'jc-interactive-map',
    });
    const tearDrop = document.createElement("div");
    tearDrop.innerHTML = `<div className="flex w-12 h-12">
      <div class="marker"></div>
      <span class="beacon"></span>
    </div>`;

    return new AdvancedMarkerElement({
      map,
      position: locationInMap,
      content: tearDrop,
    });
  };

  return (
    <main>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <input onChange={(e) => searchLatAndLngByStreet(e.target.value)} />
        <h1 className="font-semibold text-lg mb-10">Upload a new building</h1>


        <div {...getRootProps()} className="flex w-96 min-h-24 border-2 p-2 border-gray-300 border-dashed rounded-lg items-center justify-center">
          {uploadingImage && (<div className="px-3 py-1 text-xs font-medium leading-none text-center text-blue-800 bg-blue-200 rounded-full animate-pulse dark:bg-blue-900 dark:text-blue-200">loading...</div>)}
          {!uploadingImage && (
            <div className="p-2"> <input {...getInputProps()} />
              {
                isDragActive ?
                  <p>Drop the files here ...</p> :
                  <p>Drop or click to select files</p>
              }</div>
          )}
          <div>{buildingImageUrl && <img src={buildingImageUrl} alt="building" className="w-32" />}</div>
        </div>


        <form className="flex flex-col space-y-4 mt-6 w-96">
          <div className="flex">
            <label htmlFor="building-address">Address</label>
            <input
              className="flex-1 border border-gray-300 p-1 rounded ml-2"
              id="building-address"
              type="text"
              value={buildingAddress}
              onChange={(e) => {
                setBuildingAddress(e.target.value);
                searchLatAndLngByStreet(e.target.value);
                loadPreviewMap();
              }}
              placeholder="building address"
              required
            />
          </div>
          <div className="flex">
            <label htmlFor="building-altName">Alternative Name</label>
            <input
              className="flex-1 border border-gray-300 p-1 rounded ml-2"
              id="building-altName"
              type="text"
              value={buildingAltName}
              onChange={(e) => setBuildingAltName(e.target.value)}
              placeholder="building altName"
              required
            />
          </div>
          <div className="flex gap-4 w-full">
            <button type="submit" onClick={(e) => createBuilding(e)} disabled={uploadingImage} className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Submit</button>
          </div>
        </form>
        <div className="w-full h-96 mt-6" ref={mapPreviewRef} />
      </div>
    </main>
  )
}