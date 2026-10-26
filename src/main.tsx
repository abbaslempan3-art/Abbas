import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  recoverInterruptedRestore,
  downloadJson,
  snapshot,
  journalKey,
} from "./v3/backup";
import "./style.css";
const root = ReactDOM.createRoot(document.getElementById("root")!);
try {
  const recovered = recoverInterruptedRestore(localStorage);
  root.render(
    <React.StrictMode>
      <App
        recoveryNotice={
          recovered
            ? "ย้อนกลับการกู้คืนที่ค้างสำเร็จ ข้อมูลก่อนกู้คืนถูกนำกลับมาแล้ว"
            : ""
        }
      />
    </React.StrictMode>,
  );
} catch {
  root.render(
    <main>
      <div className="panel report-card">
        <h1>ต้องตรวจ recovery ก่อนทำงานต่อ</h1>
        <p role="alert">
          ยังย้อนกลับการกู้คืนไม่สำเร็จ หรืออ่านพื้นที่เก็บข้อมูลไม่ได้
          ระบบหยุดการแก้ไขเพื่อรักษาข้อมูลเดิม
          กรุณาสำรองข้อมูลดิบและตรวจพื้นที่/สิทธิ์ของ browser ก่อนโหลดใหม่
        </p>
        <button
          className="primary"
          onClick={() => {
            try {
              downloadJson(
                {
                  format: "abbas-raw-recovery",
                  stores: snapshot(localStorage),
                  journal: localStorage.getItem(journalKey),
                },
                "abbas-emergency-recovery.json",
              );
            } catch {
              alert("อ่านข้อมูลสำรองไม่ได้ กรุณาตรวจสิทธิ์ Local Storage");
            }
          }}
        >
          สำรองข้อมูลดิบฉุกเฉิน
        </button>
      </div>
    </main>,
  );
}
