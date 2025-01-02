import React, { useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import Swal from "sweetalert2";
import { firestore } from "../firebaseConfig";
import emergencySound from "../assets/emergency-sound.mp3"; // Emergency sound file

const useEmergencyAlert = () => {
  useEffect(() => {
    // Set up Firestore listener for new emergency reports
    const unsubscribe = onSnapshot(collection(firestore, "reportDetails"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const newReport = change.doc.data();

          // Show alert only if status is "on going"
          if (newReport.status !== "on going") return;

          // Convert Firestore timestamp to a formatted string
          const formattedTime = newReport.timeOfReport
            ? new Date(newReport.timeOfReport.toDate()).toLocaleString()
            : "Not Specified";

          // Play emergency sound
          const audio = new Audio(emergencySound);
          audio
            .play()
            .catch((error) =>
              console.error("Failed to play the emergency sound:", error)
            );

          // Display alert popup
          Swal.fire({
            title: "🚨 New Emergency Report!",
            html: `
              <strong>Reported By:</strong> ${newReport.reportedBy || "Unknown Caller"}<br />
              <strong>Time of Report:</strong> ${formattedTime}<br />
            `,
            icon: "warning",
            confirmButtonText: "View Dashboard",
            customClass: {
              popup: "swal-custom-popup",
            },
          });
        }
      });
    });

    // Clean up the Firestore listener on component unmount
    return () => unsubscribe();
  }, []);
};

export default useEmergencyAlert;
