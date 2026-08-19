import { dark, light } from './tokens'

describe('design tokens', () => {
  it('uses the approved light palette', () => {
    expect(light).toEqual({
      paper: '#E7E9E4',
      sheet: '#F5F6F3',
      ink: '#1B211E',
      mute: '#66736C',
      pen: '#4A90C8',
      stamp: '#C1392B',
      warn: '#C4852A',
    })
  })

  it('uses the approved dark palette', () => {
    expect(dark).toEqual({
      paper: '#131614',
      sheet: '#1A1F1C',
      ink: '#E8EBE6',
      mute: '#8B9891',
      pen: '#7EB7E3',
      stamp: '#E07068',
      warn: '#D4A04A',
    })
  })
})
