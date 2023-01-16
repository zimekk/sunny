import { Dispatch, SetStateAction, useState } from "react";
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
} from "rxjs/operators";
import { of, animationFrameScheduler } from "rxjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlayCircle,
  faPauseCircle,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";

type State = "started" | "paused" | "reset";

// https://observable-hooks.js.org/examples/pomodoro-timer-rxjs7.html
export const Clock = ({ seconds }: { seconds: number }) => {
  const restMinutes = ~~(seconds / 60) % 60;
  const restSeconds = (seconds - restMinutes * 60) % 60;
  return (
    <div>
      {restMinutes}:{restSeconds}
    </div>
  );
};

const pomodoroSeconds = 1 * 60;

export const Timer = ({ state }: { state: State }) => {
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
              map((startTime) => ~~((Date.now() - startTime) / 1000)),
              distinctUntilChanged(),
              // pause implementation
              withLatestFrom(timerState$),
              filter(([, state]) => state === "started"),
              // time's up!
              take(pomodoroSeconds),
              // count how many second left
              scan((timeLeft) => timeLeft - 1, pomodoroSeconds)
            )
      )
    )
  );
  const seconds = useObservableState(countDown$, pomodoroSeconds);
  return <Clock seconds={seconds} />;
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
      className="button is-dark is-large"
      aria-label="Start count down"
      style={{ margin: 5 }}
      disabled={state === "started"}
      onClick={() => onChange("started")}
    >
      <FontAwesomeIcon icon={faPlayCircle} />
    </button>
    <button
      className="button is-dark is-large"
      aria-label="Pause count down"
      style={{ margin: 5 }}
      disabled={state !== "started"}
      onClick={() => onChange("paused")}
    >
      <FontAwesomeIcon icon={faPauseCircle} />
    </button>
    <button
      className="button is-dark is-large"
      aria-label="Reset count down"
      style={{ margin: 5 }}
      onClick={() => onChange("reset")}
    >
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
  return <h2 className="title is-6">{title}</h2>;
};

export default function () {
  const [timerState, updateState] = useState<State>("reset");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Title state={timerState} />
      <Timer state={timerState} />
      <TimerBtnGroup state={timerState} onChange={updateState} />
    </div>
  );
}
