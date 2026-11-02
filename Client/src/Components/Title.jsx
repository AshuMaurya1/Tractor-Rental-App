const Title = ({ title, subtitle, align }) => {
  return (
    <div className={`flex flex-col justify-center ${align === "left" ? "items-start text-left" : "items-center text-center"}`}>
      <h2 className='font-bold text-xl sm:text-2xl text-slate-900 tracking-tight'>{title}</h2>
      {subtitle && <p className='text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed'>{subtitle}</p>}
    </div>
  )
}

export default Title
