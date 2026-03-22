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
    <main className="min-h-screen w-full bg-[#f0f4f5] text-[#212b32]">
      <section className="grid min-h-screen md:grid-cols-2">

        {/* LEFT TEXT */}
        <div className="flex items-center justify-center px-6">
          <div className="max-w-prose">
            <h1 className="text-4xl font-bold text-[#212b32] sm:text-5xl">
              Check Your Vaccination Status
              <strong className="text-[#005EB8]"> with confidence </strong>
            </h1>

            <p className="mt-4 text-[#425563] sm:text-lg">
              A simple NHS-style decision tool to help you understand if your vaccinations are up to date.
            </p>

            <div className="justify-center mt-6 flex gap-4">
              <button
                onClick={gotoForm}
                className="rounded bg-[#005EB8] px-5 py-3 text-white hover:bg-[#003087] hover:cursor-pointer"
              >
                Get Started
              </button>

              <button onClick={gotoLearnMore} className="rounded border-2 border-[#005EB8] bg-white px-5 py-3 text-[#005EB8] hover:bg-[#f0f4f5] hover:cursor-pointer">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="h-full w-full">
          <img
            src={heroImage}
            alt="Vaccination information"
            className="h-full w-full object-cover"
          />
        </div>

      </section>
    </main>
  )
}

export default FormPage