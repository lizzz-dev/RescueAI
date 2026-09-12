import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_styled_paragraph(doc, text, style='Normal', space_before=0, space_after=6, line_spacing=1.15, bold=False, italic=False, color=None):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    
    # Process basic markdown bold/italic formatting
    # Regex splits while keeping bold/italic markers
    tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', text)
    for token in tokens:
        if not token:
            continue
        run = p.add_run()
        if token.startswith('**') and token.endswith('**'):
            run.text = token[2:-2]
            run.bold = True
        elif token.startswith('*') and token.endswith('*'):
            run.text = token[1:-1]
            run.italic = True
        elif token.startswith('`') and token.endswith('`'):
            run.text = token[1:-1]
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(199, 37, 78)
        else:
            run.text = token
            run.bold = bold
            run.italic = italic
        
        if color:
            run.font.color.rgb = color
            
    return p

def convert_prd():
    md_path = 'PRD.md'
    docx_path = 'RescueAI_PRD.docx'
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(33, 37, 41)
    
    in_code_block = False
    code_block_lines = []
    in_table = False
    table_rows = []
    
    i = 0
    n = len(lines)
    
    while i < n:
        raw_line = lines[i]
        line = raw_line.strip()
        
        # Code block handling
        if line.startswith('```'):
            if in_code_block:
                # End code block
                in_code_block = False
                code_text = '\n'.join(code_block_lines)
                tbl = doc.add_table(rows=1, cols=1)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                cell = tbl.cell(0, 0)
                set_cell_background(cell, "F4F6F8")
                set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
                cp = cell.paragraphs[0]
                cp.paragraph_format.space_before = Pt(2)
                cp.paragraph_format.space_after = Pt(2)
                crun = cp.add_run(code_text)
                crun.font.name = 'Consolas'
                crun.font.size = Pt(8.5)
                crun.font.color.rgb = RGBColor(40, 50, 60)
                doc.add_paragraph().paragraph_format.space_after = Pt(4)
                code_block_lines = []
            else:
                in_code_block = True
                code_block_lines = []
            i += 1
            continue
            
        if in_code_block:
            code_block_lines.append(raw_line.rstrip('\r\n'))
            i += 1
            continue
            
        # Table handling
        if line.startswith('|') and line.endswith('|'):
            # Table row
            cells = [c.strip() for c in line[1:-1].split('|')]
            # Check if separator row like | :--- | :--- |
            if all(re.match(r'^:?-+:?$', c) for c in cells):
                i += 1
                continue
            table_rows.append(cells)
            in_table = True
            i += 1
            continue
        elif in_table:
            # End of table
            in_table = False
            if table_rows:
                num_cols = max(len(r) for r in table_rows)
                tbl = doc.add_table(rows=len(table_rows), cols=num_cols)
                tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
                tbl.autofit = True
                
                for r_idx, row_data in enumerate(table_rows):
                    for c_idx in range(num_cols):
                        c_text = row_data[c_idx] if c_idx < len(row_data) else ""
                        cell = tbl.cell(r_idx, c_idx)
                        set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
                        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
                        
                        p = cell.paragraphs[0]
                        p.paragraph_format.space_before = Pt(2)
                        p.paragraph_format.space_after = Pt(2)
                        p.paragraph_format.line_spacing = 1.05
                        
                        tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', c_text)
                        for token in tokens:
                            if not token:
                                continue
                            run = p.add_run()
                            if token.startswith('**') and token.endswith('**'):
                                run.text = token[2:-2]
                                run.bold = True
                            elif token.startswith('*') and token.endswith('*'):
                                run.text = token[1:-1]
                                run.italic = True
                            elif token.startswith('`') and token.endswith('`'):
                                run.text = token[1:-1]
                                run.font.name = 'Consolas'
                                run.font.size = Pt(8.5)
                            else:
                                run.text = token
                            
                            if r_idx == 0:
                                run.bold = True
                                run.font.color.rgb = RGBColor(255, 255, 255)
                                run.font.size = Pt(9.5)
                            else:
                                run.font.size = Pt(9)
                                
                        if r_idx == 0:
                            set_cell_background(cell, "1A365D")  # Navy header
                        elif r_idx % 2 == 1:
                            set_cell_background(cell, "F8FAFC")  # Light zebra
                        else:
                            set_cell_background(cell, "FFFFFF")
                doc.add_paragraph().paragraph_format.space_after = Pt(6)
            table_rows = []
            
        # Empty line
        if not line:
            i += 1
            continue
            
        # Horizontal rule
        if line in ('---', '***', '___'):
            i += 1
            continue
            
        # Document Title (# Title)
        if line.startswith('# '):
            title_text = line[2:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(title_text)
            run.font.name = 'Calibri'
            run.font.size = Pt(24)
            run.bold = True
            run.font.color.rgb = RGBColor(15, 23, 42) # Slate 900
            i += 1
            continue
            
        # Subtitle / H2 (## Subtitle)
        if line.startswith('## '):
            h2_text = line[3:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(16)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run(h2_text)
            run.font.name = 'Calibri'
            run.font.size = Pt(16)
            run.bold = True
            run.font.color.rgb = RGBColor(30, 58, 138) # Deep Blue
            i += 1
            continue
            
        # Section H3 (### Header)
        if line.startswith('### '):
            h3_text = line[4:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(h3_text)
            run.font.name = 'Calibri'
            run.font.size = Pt(13)
            run.bold = True
            run.font.color.rgb = RGBColor(51, 65, 85) # Slate 700
            i += 1
            continue
            
        # H4 (#### Header)
        if line.startswith('#### '):
            h4_text = line[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(h4_text)
            run.font.name = 'Calibri'
            run.font.size = Pt(11.5)
            run.bold = True
            run.font.color.rgb = RGBColor(71, 85, 105)
            i += 1
            continue
            
        # Unordered list item (- or *)
        if line.startswith('- ') or line.startswith('* '):
            item_text = line[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', item_text)
            for token in tokens:
                if not token:
                    continue
                run = p.add_run()
                if token.startswith('**') and token.endswith('**'):
                    run.text = token[2:-2]
                    run.bold = True
                elif token.startswith('*') and token.endswith('*'):
                    run.text = token[1:-1]
                    run.italic = True
                elif token.startswith('`') and token.endswith('`'):
                    run.text = token[1:-1]
                    run.font.name = 'Consolas'
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = RGBColor(199, 37, 78)
                else:
                    run.text = token
            i += 1
            continue
            
        # Numbered list item
        m_num = re.match(r'^(\d+)\.\s+(.*)$', line)
        if m_num:
            item_text = m_num.group(2)
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*|`.*?`)', item_text)
            for token in tokens:
                if not token:
                    continue
                run = p.add_run()
                if token.startswith('**') and token.endswith('**'):
                    run.text = token[2:-2]
                    run.bold = True
                elif token.startswith('*') and token.endswith('*'):
                    run.text = token[1:-1]
                    run.italic = True
                elif token.startswith('`') and token.endswith('`'):
                    run.text = token[1:-1]
                    run.font.name = 'Consolas'
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = RGBColor(199, 37, 78)
                else:
                    run.text = token
            i += 1
            continue
            
        # Regular paragraph
        add_styled_paragraph(doc, line, space_before=2, space_after=6)
        i += 1
        
    doc.save(docx_path)
    print(f"Successfully generated {docx_path} ({os.path.getsize(docx_path)} bytes)")

if __name__ == '__main__':
    convert_prd()
