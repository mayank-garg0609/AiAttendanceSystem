import gradio as gr
from PIL import Image

try:
    from recognize import recognize_faces
except Exception as e:
    print("Error importing recognize module:", e)
    raise RuntimeError("Recognizer module failed to load, cannot start app.") from e

def recognize_from_image(image: Image.Image):
    try:
        detected_students = recognize_faces(image)
        return detected_students  # return as a Python list (e.g. [1, 2, 3])
    except Exception as e:
        return {"error": str(e)}

iface = gr.Interface(
    fn=recognize_from_image,
    inputs=gr.Image(type="pil"),
    outputs=gr.JSON(),
    title="Student Recognition System",
    description="Upload a group photo to detect and recognize students using a trained model."
)

if __name__ == "__main__":
    iface.launch()
