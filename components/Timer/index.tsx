import { Dispatch, SetStateAction, useCallback, useRef, useState } from "react";
import { format } from "date-fns";
import {
  useObservable,
  pluckFirst,
  useObservableState,
} from "observable-hooks";
import {
  map,
  filter,
  distinctUntilChanged,
  switchMap,
  repeat,
  withLatestFrom,
  scan,
  take,
  tap,
} from "rxjs/operators";
import { of, animationFrameScheduler } from "rxjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";

type State = "started" | "paused" | "reset";

// https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
// https://mdn.github.io/web-speech-api/speak-easy-synthesis/
async function speak(text: string) {
  speechSynthesis.speak(
    Object.assign(new SpeechSynthesisUtterance(), {
      // msg.volume = 1; // 0 to 1
      // msg.rate = 1; // 0.1 to 10
      // msg.pitch = 1; //0 to 2
      // msg.lang = this.DEST_LANG;
      text,
      onend: () => console.log("SPEECH_DONE"),
    })
  );
}

// https://observable-hooks.js.org/examples/pomodoro-timer-rxjs7.html
function Clock({ seconds }: { seconds: number }) {
  return (
    <div style={{ fontSize: "xxx-large" }}>
      {format(seconds * 1000, "mm:ss")}
    </div>
  );
}

// const pomodoroSeconds = 33, ticksPerSecond = 3;
// const pomodoroSeconds = 18, ticksPerSecond = 3;
const pomodoroSeconds = 65,
  ticksPerSecond = 1;

export const Timer = ({ state }: { state: State }) => {
  const refTick = useRef<HTMLAudioElement>(null);
  const refAlarm = useRef<HTMLAudioElement>(null);

  const playTick = useCallback(() => {
    if (refTick.current) {
      refTick.current.play();
    }
  }, [refTick]);
  const playAlarm = useCallback(() => {
    if (refAlarm.current) {
      refAlarm.current.play();
    }
  }, [refAlarm]);

  const timerState$ = useObservable(pluckFirst, [state]);
  const countDown$ = useObservable(() =>
    timerState$.pipe(
      map((state) => state === "reset"),
      distinctUntilChanged(),
      switchMap((isReset) =>
        isReset
          ? of(pomodoroSeconds)
          : // high accuracy timing
            // repetitively calculate the diff
            of(animationFrameScheduler.now(), animationFrameScheduler).pipe(
              repeat(),
              // extract seconds
              map((startTime) =>
                Math.floor((Date.now() - startTime) / 1000 / ticksPerSecond)
              ),
              distinctUntilChanged(),
              // pause implementation
              withLatestFrom(timerState$),
              filter(([, state]) => state === "started"),
              // time's up!
              take(pomodoroSeconds),
              // count how many second left
              scan((timeLeft) => timeLeft - 1, pomodoroSeconds),
              tap((timeLeft) => {
                const text = {
                  62: "uwaga!",
                  60: "start!",
                  30: "połowa czasu!",
                  5: "pięć...",
                  4: "cztery...",
                  3: "trzy...",
                  2: "dwa...",
                  1: "jeden...",
                  0: "koniec! ... czas na przerwę...",
                }[timeLeft];
                console.log({ timeLeft, text });
                if (text) {
                  speak(text);
                }
              }),
              tap((timeLeft) => (timeLeft > 0 ? playTick() : playAlarm()))
            )
      )
    )
  );
  const seconds = useObservableState(countDown$, pomodoroSeconds);
  return (
    <div>
      {/* https://freesound.org/people/Rudmer_Rotteveel/sounds/536420/ */}
      <audio
        ref={refAlarm}
        src="/audio/536420_4921277-lq.ogg"
        autoPlay={false}
      />
      {/* https://freesound.org/people/malle99/sounds/496760/ */}
      <audio
        ref={refTick}
        src="/audio/496760_6712901-lq.ogg"
        autoPlay={false}
      />
      <Clock seconds={seconds} />
    </div>
  );
};

export const TimerBtnGroup = ({
  state,
  onChange,
}: {
  state: State;
  onChange: Dispatch<SetStateAction<State>>;
}) => (
  <div>
    <button
      style={{ margin: 5 }}
      disabled={state === "started"}
      onClick={() => onChange("started")}
    >
      <FontAwesomeIcon icon={faPlayCircle} />
    </button>
    <button
      style={{ margin: 5 }}
      disabled={state !== "started"}
      onClick={() => onChange("paused")}
    >
      <FontAwesomeIcon icon={faPauseCircle} />
    </button>
    <button style={{ margin: 5 }} onClick={() => onChange("reset")}>
      <FontAwesomeIcon icon={faUndo} />
    </button>
  </div>
);

export const Title = ({ state }: { state: State }) => {
  const title =
    state === "started"
      ? "Greatness is within sight!!"
      : state === "paused"
      ? "Never quite, keep going!!"
      : "Let the countdown begin!!";
  return <div>{title}</div>;
};

export default function App() {
  const [state, setState] = useState<State>("reset");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <Title state={state} />
      <Timer state={state} />
      <TimerBtnGroup state={state} onChange={setState} />
    </div>
  );
}
