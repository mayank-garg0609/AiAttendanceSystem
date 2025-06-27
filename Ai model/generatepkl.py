import face_recognition

# Load an image (e.g. during registration)
image = face_recognition.load_image_file("group_photo1.jpg")

# Detect faces and compute 128-d embeddings
face_encodings = face_recognition.face_encodings(image)

# Get the first detected face's encoding (assuming one face per image)
if face_encodings:
    embedding = face_encodings[0]  # This is the 128-d embedding
    print(embedding)