"use client";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

type Props = {};

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState<boolean>(false);
  return (
    <div className="flex h-screen">
      {/* Left division - webcam and canvas */}
      <div className="relative">
        <div className="relative h-screen w-full">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="h-full w-full object-contain p-2"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          ></canvas>
        </div>
      </div>

      {/* Right division - container for button panels and wikis */}
      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md rounded-md p-4">
          {/* Top Section */}
          <div className="flex flex-col gap-2">
            <ModeToggle />

            <Separator />
          </div>

          {/* Middle Section */}
          <div className="flex flex-col gap-2">
            <Separator />

            <Separator />
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col gap-2"></div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
