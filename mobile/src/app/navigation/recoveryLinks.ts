import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import type { SessionState } from './types';

export type RecoveryLink = {
  screen: 'ResetPassword' | 'ActivateAccount';
  token: string;
};

// Accept only our exact URI shape. No arbitrary hosts, redirects, query params or commands.
export function parseRecoveryLink(
  url: string | null | undefined,
): RecoveryLink | null {
  const match = url?.match(
    /^worksphere:\/\/(reset|activate)\/([A-Za-z0-9_-]{43})$/,
  );
  return match
    ? {
        screen: match[1] === 'reset' ? 'ResetPassword' : 'ActivateAccount',
        token: match[2],
      }
    : null;
}

export function useRecoveryLink(sessionState: SessionState) {
  const current = useRef(sessionState);
  current.current = sessionState;
  const generation = useRef(0);
  const sequence = useRef(0);
  const [pending, setPending] = useState<
    (RecoveryLink & { sequence: number }) | null
  >(null);

  useEffect(() => {
    if (sessionState === 'AUTHENTICATED') {
      generation.current++;
      setPending(null);
    }
  }, [sessionState]);

  useEffect(() => {
    let live = true;
    const initialGeneration = generation.current;
    const receive = (url: string | null | undefined) => {
      if (!live || current.current === 'AUTHENTICATED') return;
      const link = parseRecoveryLink(url);
      if (link) setPending({ ...link, sequence: ++sequence.current });
    };
    // A warm link supersedes an asynchronous initial URL, even if it is malformed.
    const listener = Linking.addEventListener('url', event => {
      generation.current++;
      receive(event.url);
    });
    void Linking.getInitialURL()
      .then(url => {
        if (generation.current === initialGeneration) receive(url);
      })
      .catch(() => {
        /* Manual paste remains available; never reflect a URL/token in errors. */
      });
    return () => {
      live = false;
      listener.remove();
    };
  }, []);

  // During bootstrap keep the candidate in memory; discard it if a valid session restores.
  return sessionState === 'UNAUTHENTICATED' ? pending : null;
}
