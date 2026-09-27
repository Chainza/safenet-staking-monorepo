import { useEffect } from "react";
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useChainId, useConnection } from "wagmi";

/**
 * `useMutation` whose result is scoped to the current account and chain: when
 * either changes the mutation resets, so a previous account's outcome (a
 * `proposed` Safe tx behind "Queued in Safe", a failure alert, …) never leaks
 * into the next one. Every write flow uses this instead of `useMutation`.
 *
 * A write still in flight keeps running (its hook-level `onSuccess`
 * invalidations still fire); only this component's view of it is cleared.
 */
export function useConnectionScopedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mutation = useMutation(options);
  const { address } = useConnection();
  const chainId = useChainId();
  const { reset } = mutation; // stable: bound once by react-query's MutationObserver

  useEffect(() => {
    reset();
  }, [address, chainId, reset]);

  return mutation;
}
