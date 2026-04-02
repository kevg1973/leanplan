import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error: error.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:40, fontFamily:"monospace", background:"#fff", minHeight:"100vh" }}>
          <h2 style={{ color:"red", marginBottom:16 }}>App Error</h2>
          <pre style={{ background:"#f5f5f5", padding:16, borderRadius:8, fontSize:12, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
            {this.state.error}
          </pre>
          <button onClick={()=>this.setState({error:null})} style={{ marginTop:16, padding:"8px 16px" }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
