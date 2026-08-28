import { Component, type ErrorInfo, type ReactNode } from "react";
import { logger } from "../lib/logger.js";

interface PanelErrorBoundaryProps {
  children: ReactNode;
}

interface PanelErrorBoundaryState {
  failed: boolean;
}

/**
 * Last-resort catch around the action panels: a render crash (e.g. data in a
 * shape no validation anticipated) degrades to an inline notice instead of
 * unmounting the host app's tree. Error boundaries are still class-only in
 * React.
 */
export class PanelErrorBoundary extends Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  state: PanelErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): PanelErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error("panel render failed:", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          className="ss:mt-4 ss:rounded-xl ss:border ss:border-error/40 ss:bg-error/10 ss:p-4 ss:text-center ss:text-sm ss:text-error"
        >
          Something went wrong rendering this panel. Reload the page to try again.
        </div>
      );
    }
    return this.props.children;
  }
}
