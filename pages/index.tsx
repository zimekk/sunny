import type { InferGetStaticPropsType, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Inter } from "@next/font/google";
import { format } from "date-fns";
import Clock from "../components/Clock";
import Timer from "../components/Timer";
import styles from "../styles/Home.module.css";

import type { Weather } from "./api/weather";

const inter = Inter({ subsets: ["latin"] });

// https://www.amcharts.com/free-animated-svg-weather-icons/
// https://github.com/bobangajicsm/react-weather-app/tree/main/public/icons
// https://openweathermap.org/weather-conditions
function Icon({ icon }: { icon: string }) {
  return (
    <Image
      className={styles.logo}
      // src={`/icons/${icon}.png`}
      src={`https://openweathermap.org/img/wn/${icon}@4x.png`}
      alt="Weather"
      width={100}
      height={100}
      priority
    />
  );
}

// https://github.com/bobangajicsm/react-weather-app
function CurrentWeather({ main, name, sys, weather }: Weather) {
  return (
    <div>
      <div>{format(Date.now(), "do MMMM yyyy")}</div>
      <div style={{ fontSize: "xx-large" }}>
        <a
          href={`https://openweathermap.org/city/756135`}
          target={"_blank"}
          rel={"noopener noreferrer"}
        >{`${name}, ${sys.country}`}</a>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {weather.map(({ icon }, key) => (
          <Icon key={key} icon={icon} />
        ))}
        <div>
          <div style={{ fontSize: "xx-large" }}>{main.temp}°C</div>
          <div>(feels_like: {main.feels_like}°C)</div>
        </div>
      </div>
      <div>humidity: {main.humidity}%,</div>
      <div>pressure: {main.pressure}hPa</div>
    </div>
  );
}

export const getStaticProps: GetStaticProps<{
  // weather: Weather;
}> = async () => {
  // const res = await fetch(`${process.env.API}/api/weather`);
  // const weather = await res.json();
  return {
    props: {
      // weather,
    },
  };
};

function Loading() {
  return <div>Loading...</div>;
}

export default function Home(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const [weather, setData] = useState<Weather | null>(null);

  useEffect(() => {
    fetch("/api/weather")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
      });
  }, []);

  if (weather === null) return <Loading />;

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <CurrentWeather {...weather} />
        <Clock />
        <Timer />

        {false && (
          <div className={styles.description}>
            <p>
              Get started by editing&nbsp;
              <code className={styles.code}>pages/index.tsx</code>
            </p>
            <div>
              <a
                href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                By{" "}
                <Image
                  src="/vercel.svg"
                  alt="Vercel Logo"
                  className={styles.vercelLogo}
                  width={100}
                  height={24}
                  priority
                />
              </a>
            </div>
          </div>
        )}

        {false && (
          <div className={styles.center}>
            <Image
              className={styles.logo}
              src="/next.svg"
              alt="Next.js Logo"
              width={180}
              height={37}
              priority
            />
            <div className={styles.thirteen}>
              <Image
                src="/thirteen.svg"
                alt="13"
                width={40}
                height={31}
                priority
              />
            </div>
          </div>
        )}

        {false && (
          <div className={styles.grid}>
            <a
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className={inter.className}>
                Docs <span>-&gt;</span>
              </h2>
              <p className={inter.className}>
                Find in-depth information about Next.js features and&nbsp;API.
              </p>
            </a>

            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className={inter.className}>
                Learn <span>-&gt;</span>
              </h2>
              <p className={inter.className}>
                Learn about Next.js in an interactive course with&nbsp;quizzes!
              </p>
            </a>

            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className={inter.className}>
                Templates <span>-&gt;</span>
              </h2>
              <p className={inter.className}>
                Discover and deploy boilerplate example Next.js&nbsp;projects.
              </p>
            </a>

            <a
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <h2 className={inter.className}>
                Deploy <span>-&gt;</span>
              </h2>
              <p className={inter.className}>
                Instantly deploy your Next.js site to a shareable URL
                with&nbsp;Vercel.
              </p>
            </a>
          </div>
        )}
      </main>
    </>
  );
}
