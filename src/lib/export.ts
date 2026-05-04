export async function exportToPDF(element: HTMLElement, filename: string) {
  const [{ toPng }, { default: jsPDF }] = await Promise.all([
    import('html-to-image'),
    import('jspdf'),
  ])

  const width = element.scrollWidth
  const height = element.scrollHeight

  const imgData = await toPng(element, {
    backgroundColor: '#000000',
    width,
    height,
    pixelRatio: 2,
    style: { overflow: 'visible' },
  })

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [width, height],
  })

  pdf.addImage(imgData, 'PNG', 0, 0, width, height)
  pdf.save(filename)
}

export async function exportToPNG(element: HTMLElement, filename: string) {
  const { toPng } = await import('html-to-image')

  const width = element.scrollWidth
  const height = element.scrollHeight

  const dataUrl = await toPng(element, {
    backgroundColor: '#000000',
    width,
    height,
    pixelRatio: 2,
    style: { overflow: 'visible' },
  })

  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}
