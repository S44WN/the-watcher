"use client";
import React, { useRef } from "react";
import Webcam from "react-webcam";

type Props = {};

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  return (
    <div>
      <Webcam />
    </div>
  );
};

export default HomePage;
