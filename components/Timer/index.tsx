import {
  faPauseCircle,
  faPlayCircle,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { format } from "date-fns";
import {
  pluckFirst,
  useObservable,
  useObservableState,
} from "observable-hooks";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEventHandler,
  type Dispatch,
  type SetStateAction,
} from "react";
import { animationFrameScheduler, of } from "rxjs";
import {
  distinctUntilChanged,
  filter,
  map,
  repeat,
  scan,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from "rxjs/operators";

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
    }),
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

// https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
// https://github.com/jorisre/react-screen-wake-lock
function ScreenWakeLock() {
  // Create a reference for the Wake Lock.
  const wakeLock = useRef<WakeLockSentinel | null>();

  useEffect(() => {
    (async () => {
      if ("wakeLock" in navigator && wakeLock.current === undefined) {
        // create an async function to request a wake lock
        try {
          wakeLock.current = null;
          wakeLock.current = await navigator.wakeLock.request("screen");
          wakeLock.current.addEventListener("release", () => {
            console.log("Wake Lock is released!");
          });
          console.log("Wake Lock is active!");
        } catch (err) {
          // The Wake Lock request has failed - usually system related, such as battery.
          console.log({ err });
        }
      }
    })();

    return () => {
      if (wakeLock.current) {
        wakeLock.current.release();
      }
    };
  }, [wakeLock]);
  return null;
}

const R = 48;
const P = 2 * Math.PI * R;

// https://codepen.io/evth/pen/zBNqrL
// https://stackoverflow.com/questions/44006664/the-calculation-behind-progress-circle-using-dasharray-and-dashoffset
function Progress({ percentage }: { percentage: number }) {
  return (
    <svg
      style={{
        position: "absolute",
        top: -50,
        left: -20,
        width: 150,
        height: 150,
        zIndex: -1,
      }}
      viewBox="0 0 100 100"
    >
      <linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#2ed8a7"></stop>
        <stop offset="100%" stopColor="#a6ceff"></stop>
      </linearGradient>
      <circle
        strokeLinecap="round"
        cx="50"
        cy="50"
        r={R}
        stroke="url(#linear)"
        strokeWidth="4"
        fill="none"
        strokeDasharray={`${percentage * P} ${P}`}
        stroke-mitterlimit="0"
        transform="rotate(-90 ) translate(-100 0)"
        style={{
          transition: "stroke-dasharray .05s",
        }}
      ></circle>
    </svg>
  );
}

export const Timer = ({
  state,
  pomodoroSeconds,
  ticks,
  ticksPerSecond,
}: {
  state: State;
  pomodoroSeconds: number;
  ticks: number;
  ticksPerSecond: number;
}) => {
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
                Math.floor((Date.now() - startTime) / 1000 / ticksPerSecond),
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
                  [ticks + 2]: "uwaga!",
                  [ticks]: "start!",
                  [Math.floor(ticks / 2)]: "połowa czasu!",
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
              tap((timeLeft) => (timeLeft > 0 ? playTick() : playAlarm())),
            ),
      ),
    ),
  );
  const seconds = useObservableState(countDown$, pomodoroSeconds);
  return (
    <div style={{ position: "relative" }}>
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
      <Progress percentage={1 - seconds / pomodoroSeconds} />
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

export default function App({
  configList,
  config: initialConfig = "180_1",
}: {
  configList: Record<string, [number, number, number]>;
  config?: string;
}) {
  const [state, setState] = useState<State>("reset");
  const [config, setConfig] = useState(() => initialConfig);
  const [ticks, start, ticksPerSecond] = useMemo(
    () => configList[config],
    [config],
  );
  const pomodoroSeconds = ticks + start;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <label>
        <select
          value={config}
          onChange={useCallback<ChangeEventHandler<HTMLSelectElement>>(
            ({ target }) => setConfig(target.value),
            [],
          )}
        >
          {Object.entries(configList).map(([value, label]) => (
            <option key={value} value={value}>
              {label[2] === 1 ? `${label[0]}s` : `${label[0]} x ${label[2]}s`}
            </option>
          ))}
        </select>
      </label>
      <Title state={state} />
      <Timer
        key={config}
        state={state}
        pomodoroSeconds={pomodoroSeconds}
        ticks={ticks}
        ticksPerSecond={ticksPerSecond}
      />
      <TimerBtnGroup state={state} onChange={setState} />
      {state === "started" && <ScreenWakeLock />}
    </div>
  );
}
