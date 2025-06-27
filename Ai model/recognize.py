import os
project_dir = os.path.dirname(os.path.abspath(__file__))
os.environ["DEEPFACE_HOME"] = os.path.join(project_dir, ".deepface")
import cv2
import numpy as np
from deepface import DeepFace
from mtcnn import MTCNN
import pickle
from sklearn.neighbors import KDTree

def recognize_faces(group_photo):
    image = np.array(group_photo)

    if image is None:
        print(f"Error: Failed to load image '{group_photo}'.")
        return []
    
    # Load image and detect faces using MTCNN
    detector = MTCNN()

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    faces = detector.detect_faces(image_rgb)
    filtered_faces = [
        face for face in faces
        if (face['confidence'] >= 0.7 and
            face['box'][2] > 50 and  # minimum width
            face['box'][3] > 50)     # minimum height
    ]

    faces = filtered_faces

    if not faces:
        print("No faces detected.")
        return []

    # Load precomputed embeddings
    try:
        with open("AI_dataset.pkl", "rb") as f:
            data = pickle.load(f)
    except (FileNotFoundError, IOError):
        print("Error: 'student_embeddings.pkl' not found or corrupted.")
        return []

    reference_embeddings = np.array(data["embeddings"])
    student_ids = data["ids"]

    # Create KDTree for efficient search
    try:
        tree = KDTree(reference_embeddings)
    except ValueError as e:
        print(f"Error building KDTree: {e}")
        return []

    detected_students = []

    # Face recognition loop
    for i, face in enumerate(faces):
        x, y, width, height = face["box"]
        x, y = max(0, x), max(0, y)
        width, height = min(image.shape[1] - x, width), min(image.shape[0] - y, height)

        face_crop = image_rgb[y:y+height, x:x+width]

        try:
            face_crop = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
            face_embedding = DeepFace.represent(face_crop, model_name="VGG-Face", enforce_detection=False)[0]['embedding']

            dist, index = tree.query([face_embedding], k=1)
            best_match_id = student_ids[index[0][0]]

            # if dist[0][0] < 0.2:  # Optimal threshold for VGG-Face
            #     # print(f"Face {i}: {best_match_id} (Distance: {dist[0][0]:.4f})")
            #     detected_students.append(best_match_id)
            # else:
                # print(f"Face {i}: Unknown (Distance: {dist[0][0]:.4f})")

        except Exception as e:
            print(f"Error processing face {i}: {e}")
            continue

        detected_students.append(best_match_id)
        # Draw bounding box and label
        # color = (0, 255, 0) if best_match_id != 0000 else (255, 0, 0)
        # cv2.rectangle(image_rgb, (x, y), (x + width, y + height), color, 2)
        # cv2.putText(image_rgb, str(best_match_id), (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 1.8, color, 2)

    # Show result
    # plt.figure(figsize=(10, 6))
    # plt.imshow(image_rgb)
    # plt.axis("off")
    # plt.show()

    return detected_students

# def cost_function(group_photo, size_reduction):
#     """Calculates time taken for face recognition with image size reduction."""
#     start_time = time.time()

#     detected_students = recognize_faces(group_photo)

#     elapsed_time = round(time.time() - start_time, 2)

#     print(f"Time: {elapsed_time}s")
#     if detected_students:
#         for student_id in detected_students:
#             print(f"ID: {student_id}, Time: {elapsed_time:.2f}s")
#     else:
#         print("No students detected.")

# if __name__ == "__main__":
#     group_photo = "group_photo1.jpg"

#     try:
#         for scale in [0.05]:
#             cost_function(group_photo, size_reduction=scale)
#     except Exception as e:
#         print(f"Unexpected Error: {e}")
