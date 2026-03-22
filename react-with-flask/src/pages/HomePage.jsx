import { useNavigate } from 'react-router-dom'
import heroImage from '../assets/hero.jpg'

function FormPage() {
  const navigate = useNavigate()

  const gotoForm = (event) => {
    event.preventDefault()
    navigate('/form')
  }
  const gotoLearnMore = (event) => {
    event.preventDefault()
    navigate('/about')
  }
  return (
    <main className="min-h-screen w-full bg-white text-slate-900 dark:text-slate-300 ">
      
      <section className="grid md:grid-cols-2 min-h-screen ">
        
        {/* LEFT TEXT */}
        <div className="flex items-center justify-center px-6">
          <div className="max-w-prose">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Lorem ipsum dolor sit amet
              <strong className="text-indigo-600"> lorem </strong>
              ipsum
            </h1>

            <p className="mt-4 text-gray-700 sm:text-lg">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            </p>

            <div className="justify-center mt-6 flex gap-4">
              <button
                onClick={gotoForm}
                className="rounded bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 hover:cursor-pointer"
              >
                Get Started
              </button>

              <button onClick={gotoLearnMore} className="rounded border px-5 py-3 text-gray-700 hover:bg-gray-50 hover:cursor-pointer">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="h-full w-full">
          <img
            src={heroImage}
            alt="hero"
            className="h-full w-full object-cover"
          />
        </div>

      </section>
    </main>
  )
}

export default FormPage