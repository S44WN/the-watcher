"use client";
import React, { useEffect, useRef, useState } from "react";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Toaster } from "@/components/ui/sonner";
import { beep } from "@/utils/audio";
import {
  Camera,
  FlipHorizontal,
  MoonIcon,
  PersonStanding,
  SunIcon,
  Video,
  Volume2,
} from "lucide-react";
import { Rings } from "react-loader-spinner";
import Webcam from "react-webcam";
import { toast } from "sonner";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { drawOnCanvas } from "@/utils/draw";
import SocialMediaLinks from "@/components/social-links";

type Props = {};

let interval: any = null;
let stopTimeout: any = null;

const sUsrAg = navigator.userAgent; //get the user agent string

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState<boolean>(false);

  const mediaRecoderRef = useRef<MediaRecorder | null>(null);

  //initailize media recorder
  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      let stream: any = null;

      if (sUsrAg.indexOf("Firefox") > -1) {
        stream = (webcamRef.current.video as any).mozCaptureStream();
      } else {
        stream = (webcamRef.current.video as any).captureStream();
      }

      if (stream) {
        mediaRecoderRef.current = new MediaRecorder(stream);

        mediaRecoderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });
            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `video-${formatDate(new Date())}.webm`;
            a.click();
          }
        };
        mediaRecoderRef.current.onstart = (e) => {
          setIsRecording(true);
        };
        mediaRecoderRef.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    setLoading(true);
    initModel();
  }, []);

  //loads model
  async function initModel() {
    const loadedModel: ObjectDetection = await cocoSsd.load({
      base: "mobilenet_v2",
    });
    setModel(loadedModel);
  }

  useEffect(() => {
    if (model) {
      setLoading(false);
    }
  }, [model]);

  //runs prediction
  async function runPrediction() {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await model.detect(
        webcamRef.current.video
      );

      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));

      let isPerson: boolean = false;
      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          isPerson = prediction.class === "person";
        });
        if (isPerson && autoRecordEnabled) {
          startRecording(true);
        }
      }
    }
  }

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [webcamRef.current, model, mirrored, autoRecordEnabled]);

  return (
    <div className="flex h-screen">
      {/* Left division - webcam and canvas */}
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-contain p-2 rounded-[30px] overflow-hidden"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain rounded-[30px] overflow-hidden"
          ></canvas>
        </div>
      </div>

      {/* Right division - container for button panels and wikis */}
      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md rounded-md p-4">
          {/* Top Section */}
          <div className="flex flex-col gap-2">
            <ModeToggle />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal />
            </Button>
            <Separator className="my-2" />
          </div>

          {/* Middle Section */}
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenshot}
            >
              <Camera />
            </Button>

            <Button
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video />
            </Button>

            <Separator className="my-2" />
            <Button
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={45} />
              ) : (
                <PersonStanding />
              )}
            </Button>
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Slider
                  max={1}
                  min={0}
                  step={0.1}
                  defaultValue={[volume]}
                  onValueCommit={(value) => {
                    setVolume(value[0]); //set volume
                    beep(value[0]); //play beep sound
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Right division - wikis */}
        <div className="h-full flex-1 py-4 px-2 overflow-y-scroll">
          <RenderFeatureHighlightsSection />
        </div>
      </div>
      {loading && (
        <div className="z-50 absolute w-full h-full flex items-center justify-center bg-primary-foreground">
          Hold up...
          <Rings color="red" height={80} />
        </div>
      )}
    </div>
  );

  //handler funtions

  function userPromptScreenshot() {
    //take pictures
    if (!webcamRef.current) {
      toast("Camera not found. Please refresh.");
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      const blob = base64toBlob(imgSrc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${formatDate(new Date())}.png`;
      a.click();
      toast("Screenshot saved to downloads");
    }
    //save it to downloads
  }

  function userPromptRecord() {
    if (!webcamRef.current) {
      toast("Camera not found. Please refresh.");
    }

    if (mediaRecoderRef.current?.state === "recording") {
      //check if recording
      //if yes, stop recording
      //save it to downloads
      mediaRecoderRef.current.requestData();
      clearTimeout(stopTimeout);
      mediaRecoderRef.current.stop();
      toast("Recording saved to downloads");
    } else {
      //if no, start recording
      //rstart recording
      startRecording(false);
    }
  }

  function startRecording(dobeep: boolean) {
    if (
      mediaRecoderRef.current &&
      mediaRecoderRef.current?.state !== "recording"
    ) {
      mediaRecoderRef.current.start();
      dobeep && beep(volume);
      toast("Recording started");

      stopTimeout = setTimeout(() => {
        if (mediaRecoderRef.current?.state === "recording") {
          mediaRecoderRef.current.requestData();
          mediaRecoderRef.current.stop();
          toast("Recording saved to downloads");
        }
      }, 30000);
    }
  }

  function toggleAutoRecord() {
    if (autoRecordEnabled) {
      //didnt use prev => !prev because we want to show toast
      setAutoRecordEnabled(false);
      toast("Auto record disabled"); //show toast
    } else {
      setAutoRecordEnabled(true);
      toast("Auto record enabled");
    }
  }

  //inner components
  function RenderFeatureHighlightsSection() {
    return (
      <div className="text-xs text-muted-foreground">
        <ul className="space-y-4">
          <li>
            <strong>Dark Mode/Sys Theme 🌗</strong>
            <p>Toggle between dark mode and system theme.</p>
            <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
              <SunIcon size={14} />
            </Button>{" "}
            /{" "}
            <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
              <MoonIcon size={14} />
            </Button>
          </li>
          <li>
            <strong>Horizontal Flip ↔️</strong>
            <p>Adjust horizontal orientation.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal size={14} />
            </Button>
          </li>
          <Separator />
          <li>
            <strong>Take Pictures 📸</strong>
            <p>Capture snapshots at any moment from the video feed.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenshot}
            >
              <Camera size={14} />
            </Button>
          </li>
          <li>
            <strong>Manual Video Recording 📽️</strong>
            <p>Manually record video clips as needed.</p>
            <Button
              className="h-6 w-6 my-2"
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video size={14} />
            </Button>
          </li>
          <Separator />
          <li>
            <strong>Enable/Disable Auto Record 🚫</strong>
            <p>
              Option to enable/disable automatic video recording whenever
              required.
            </p>
            <Button
              className="h-6 w-6 my-2"
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={30} />
              ) : (
                <PersonStanding size={14} />
              )}
            </Button>
          </li>

          <li>
            <strong>Volume Slider 🔊</strong>
            <p>Adjust the volume level of the notifications.</p>
          </li>
          <li>
            <strong>Camera Feed Highlighting 🎨</strong>
            <p>
              Highlights persons in{" "}
              <span style={{ color: "#FF0F0F" }}>red</span> and other objects in{" "}
              <span style={{ color: "#00B612" }}>green</span>.
            </p>
          </li>
          <Separator />
          <li className="space-y-4">
            <strong>Share your thoughts 💬 </strong>
            <SocialMediaLinks />
            <br />
          </li>
        </ul>
      </div>
    );
  }
};

export default HomePage;

//resize canvas
function resizeCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  webcamRef: React.RefObject<Webcam>
) {
  const canvas = canvasRef.current;
  const video = webcamRef.current?.video;

  if (canvas && video) {
    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
  }
}

//format date
function formatDate(date: Date) {
  const formattedDate =
    [
      (date.getMonth() + 1).toString().padStart(2, "0"),
      date.getDate().toString().padStart(2, "0"),
      date.getFullYear(),
    ].join("-") +
    " " +
    [
      date.getHours().toString().padStart(2, "0"),
      date.getMinutes().toString().padStart(2, "0"),
      date.getSeconds().toString().padStart(2, "0"),
    ].join("-");
  return formattedDate;
}

//convert base64 to blob
function base64toBlob(base64Data: any) {
  const byteCharacters = atob(base64Data.split(",")[1]);
  const arrayBuffer = new ArrayBuffer(byteCharacters.length);
  const byteArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  return new Blob([arrayBuffer], { type: "image/png" }); // Specify the image type here
}
