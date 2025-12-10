import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="card" style={{ maxWidth: "600px", margin: "20vh auto", textAlign: "center" }}>
            <h2 className="card-title">Something went wrong</h2>
            <p className="muted" style={{ marginTop: "12px" }}>
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              className="btn pill"
              style={{ marginTop: "20px" }}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
