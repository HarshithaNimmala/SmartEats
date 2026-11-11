import cv2
import numpy as np

img = np.ones((500, 500, 3), dtype=np.uint8) * 255
cv2.putText(img, "Hemoglobin: 14.5 g/dL", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,0), 2)
cv2.putText(img, "Blood Pressure: 120/80", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,0), 2)
cv2.putText(img, "Fasting Sugar: 95 mg/dL", (50, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,0), 2)
cv2.imwrite("c:/Users/ADMIN/OneDrive/Desktop/se2/dummy_report.jpg", img)
print("Saved dummy_report.jpg")
