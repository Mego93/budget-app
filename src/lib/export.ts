export async function exportToPDF(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    backgroundColor: '#000000',
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: 420,
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width / 2, canvas.height / 2],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
  pdf.save(filename)
}

export async function exportToPNG(element: HTMLElement, filename: string) {
  const { default: html2canvas } = await import('html2canvas')

  const canvas = await html2canvas(element, {
    backgroundColor: '#000000',
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: 420,
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
