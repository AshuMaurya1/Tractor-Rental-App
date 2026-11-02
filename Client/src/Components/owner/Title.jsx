const Title = ({ title, subtitle }) => {
  return (
    <div className='mb-6'>
      <h1 className='font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight'>{title}</h1>
      {subtitle && <p className='text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed'>{subtitle}</p>}
    </div>
  )
}

export default Title
