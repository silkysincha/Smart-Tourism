from flask import Flask, request, jsonify, render_template
from recommender import recommend

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/recommend", methods=["POST"])
def get_recommendations():
    try:
        user_input = request.get_json()
        if not user_input:
            return jsonify({"error": "No input provided"}), 400

        # Convert numeric fields
        for field in ["Total_Travel_Duration_Days", "Avg_Trip_Duration_Past_Days"]:
            if field in user_input:
                try:
                    user_input[field] = float(user_input[field])
                except ValueError:
                    pass

        destinations, probabilities = recommend(user_input, n=5)
        return jsonify({
            "recommendations": destinations,
            "probabilities": probabilities
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)