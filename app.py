from flask import Flask, jsonify, render_template, request
from flask_wtf import FlaskForm
from wtforms import StringField, SubmitField
from wtforms.validators import DataRequired, Length
from flask_bootstrap import Bootstrap

app = Flask(__name__)
bootstrap = Bootstrap(app)
app.config['SECRET_KEY'] = "Change this if actually deployed seriously" #TODO: Fix

technologies = [
    { "name": "HTML", "taught": "Autumn semester", "description": "HTML is the standard markup language for creating Web pages." },
    { "name": "CSS", "taught": "Autumn semester", "description": "CSS is a language that describes the style of an HTML document." },
    { "name": "JavaScript", "taught": "Spring semester", "description": "JavaScript is the programming language of HTML and the Web because it runs in all modern browsers." },
    { "name": "Python/Flask", "taught": "Spring semester", "description": "Flask is a popular server side framework for writing web applications in Python." },
    { "name": "SQL", "taught": "Spring semester", "description": "SQL is a standard language for storing, manipulating and retrieving data in databases." },
    { "name": "Perl", "taught": "Aaaaaah please no!", "description": "What is this, 1999?" }
]

class OpinionForm(FlaskForm):
    opinion = StringField('Your Opinion: ',validators = [DataRequired(),Length(min=0,max=100)])
    submit = SubmitField('Submit')

@app.route('/')
def galleryPage():
    return render_template('index.html',technologies = technologies)


@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({'status': 'ok'})


@app.route('/api/technologies', methods=['GET'])
def api_technologies():
    return jsonify(technologies)

@app.route('/results/<int:techId>',methods=['GET','POST'])
def singleProductPage(techId):
    form = OpinionForm()
    if form.validate_on_submit():
        return render_template('SingleTechOpinion.html', technology = technologies[techId],opinion = form.opinion.data)
    else:
        return render_template('SingleVaccine.html', technology = technologies[techId], form = form)

if __name__ == '__main__':
    app.run(debug=True)
