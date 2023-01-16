import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function Clock() {
  const [time, setTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const [hour, minute, second] = format(time, "H:m:s").split(":").map(Number);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 100,
          height: 100,
          margin: "0 2em",
          outline: "3px solid #dee5fe",
          outlineOffset: "1em",
          borderRadius: "50%",
          background: "#caf3e4",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 6,
            borderRadius: 3,
            height: "30%",
            left: "50%",
            top: "50%",
            background: "rgba(91, 105, 194,.8)",
            translate: "-50% 0",
            transform: `rotate(${Math.round(
              (360 * (hour + minute / 60)) / 12 + 180
            )}deg)`,
            transformOrigin: "top",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            width: 4,
            borderRadius: 2,
            height: "40%",
            left: "50%",
            top: "50%",
            background: "rgba(91, 105, 194,.8)",
            translate: "-50% 0",
            transform: `rotate(${Math.round(
              (360 * (minute + second / 60)) / 60 + 180
            )}deg)`,
            transformOrigin: "top",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            width: 2,
            borderRadius: 1,
            height: "45%",
            left: "50%",
            top: "50%",
            background: "rgba(91, 105, 194,.8)",
            translate: "-50% 0",
            transform: `rotate(${Math.round((360 * second) / 60 + 180)}deg)`,
            transformOrigin: "top",
          }}
        ></div>
      </div>
      <div style={{ fontSize: "x-large" }}>{format(time, "HH:mm:ss")}</div>
    </div>
  );
}
