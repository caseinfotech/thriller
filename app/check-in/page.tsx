import type { Metadata } from "next";
import { Moon } from "lucide-react";
import CheckInForm from "./check-in-form";
export const metadata:Metadata={title:"Class Check-in | South Haven Thriller",description:"Check into your Thriller practice and track your class attendance."};
export default function CheckInPage(){return <main className="check-in-page"><header className="organizer-header"><a className="brand" href="/"><Moon size={23}/><span>SOUTH HAVEN <b>THRILLER FLASH MOB</b></span></a><a href="/">Event page</a></header><div className="lesson-intro"><p className="eyebrow">SHOW UP. CHECK IN. BRING THE MOVES.</p><h1>You’re part<br/>of the mob.</h1><p>Choose today’s class and enter your name. We’ll find your signup and keep track of the classes you attend.</p></div><CheckInForm/><footer><a href="https://nextdesign.dev" target="_blank" rel="noopener noreferrer">digital experience by Next Design</a></footer></main>}
