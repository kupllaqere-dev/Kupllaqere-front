import { useState, useEffect } from "react";
import supabase from "../lib/supabase";
import { establishSession } from "./authLink";
import ResetPassword from "./ResetPassword";
import {
  Page, Card, Logo, Title, Text, ErrorMsg, GhostBtn, Spinner,
} from "./styles";

// What to say once the link has been redeemed, keyed on the kind of email.
const CONFIRMED = {
  signup:       { title: "Email verified",  text: "Your account is confirmed. Taking you into the world…" },
  email_change: { title: "Email updated",   text: "Your new address is confirmed. Taking you into the world…" },
  invite:       { title: "Invite accepted", text: "You're all set. Taking you into the world…" },
};

const DEFAULT_CONFIRMED = { title: "Signed in", text: "Taking you into the world…" };

// Reload at the root so App picks the new session up the same way it does
// after Google sign-in, and the tokens drop out of the address bar.
function goToGame() {
  window.location.replace("/");
}

/**
 * The page every link in an auth email lands on (/auth/callback). It redeems
 * the link, then either sends the player into the game or — for a password
 * reset — shows the form to pick a new one.
 */
export default function AuthFlow({ params }) {
  const [state, setState] = useState("working"); // working | recovery | confirmed | error
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { error: err } = await establishSession(params);
      if (cancelled) return;

      if (err) {
        setError(err);
        setState("error");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      setEmail(session?.user?.email || "");

      if (params.type === "recovery") {
        setState("recovery");
        return;
      }

      setState("confirmed");
      setTimeout(goToGame, 1600);
    })();

    return () => { cancelled = true; };
  }, [params]);

  if (state === "recovery") {
    return (
      <Page>
        <Card>
          <ResetPassword email={email} onDone={goToGame} />
        </Card>
      </Page>
    );
  }

  if (state === "error") {
    return (
      <Page>
        <Card>
          <Logo><img src="/Logo.png" alt="logo" /></Logo>
          <Title>Link didn&apos;t work</Title>
          <Text>We couldn&apos;t confirm that link.</Text>
          <ErrorMsg>{error}</ErrorMsg>
          <GhostBtn type="button" onClick={goToGame}>Back to sign in</GhostBtn>
        </Card>
      </Page>
    );
  }

  const message = state === "confirmed"
    ? (CONFIRMED[params.type] || DEFAULT_CONFIRMED)
    : { title: "One moment…", text: "Confirming your link." };

  return (
    <Page>
      <Card>
        <Logo><img src="/Logo.png" alt="logo" /></Logo>
        <Title>{message.title}</Title>
        <Text>{message.text}</Text>
        {state === "working" && <Spinner />}
      </Card>
    </Page>
  );
}
