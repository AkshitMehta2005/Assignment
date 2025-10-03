import React, {useState} from 'react';
import UploadStep from './UploadStep';
import ResultView from './ResultView';


export default function App(){
  const [reportId, setReportId] = useState(null);
  const [token, setToken] = useState(null);
  return ( 
    <div style={{fontFamily:'Arial, sans-serif', padding:20, maxWidth:900, margin:'0 auto'}}>
      
      {/* {!token ? <Login onLogin={t=>setToken(t)} /> : <div>Logged in</div>} */}
      {!reportId ? <UploadStep setReportId={setReportId} token={token} /> : <ResultView id={reportId} />}
    </div>
  );
}
