#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import io
import re
import sys
from pdfminer.high_level import extract_text

def extract_text_from_pdf(pdf_path):
    """
    Extrait le texte d'un fichier PDF.
    
    Args:
        pdf_path: Chemin vers le fichier PDF
        
    Returns:
        Texte extrait du PDF
    """
    try:
        text = extract_text(pdf_path)
        return text
    except Exception as e:
        print(f"Erreur lors de l'extraction du texte: {e}")
        return None

def analyze_cv(cv_text):
    """
    Analyse le texte du CV pour extraire les informations pertinentes.
    
    Args:
        cv_text: Texte du CV
        
    Returns:
        Dictionnaire contenant les informations extraites
    """
    if not cv_text:
        return {}
    
    # Initialiser le dictionnaire de résultats
    result = {
        "name": "",
        "contact": {},
        "summary": "",
        "skills": [],
        "technical_skills": [],
        "soft_skills": [],
        "languages": [],
        "experiences": [],
        "education": []
    }
    
    # Extraire le nom (généralement au début du CV)
    name_match = re.search(r'^([A-Z][a-z]+\s+[A-Z][a-z]+)', cv_text, re.MULTILINE)
    if name_match:
        result["name"] = name_match.group(1)
    
    # Extraire les coordonnées
    email_match = re.search(r'[\w\.-]+@[\w\.-]+', cv_text)
    if email_match:
        result["contact"]["email"] = email_match.group(0)
    
    phone_match = re.search(r'(\+\d{1,3}[\s\.-]?)?(\(?\d{1,4}\)?[\s\.-]?)?(\d{1,4}[\s\.-]?)(\d{1,4}[\s\.-]?){1,2}\d{1,4}', cv_text)
    if phone_match:
        result["contact"]["phone"] = phone_match.group(0)
    
    # Extraire les compétences techniques
    # Rechercher des sections comme "Compétences techniques", "Technical Skills", etc.
    skills_section = re.search(r'(?:Compétences|Skills|SKILLS|COMPÉTENCES)[^\n]*\n(.*?)(?:\n\n|\n[A-Z])', cv_text, re.DOTALL)
    if skills_section:
        skills_text = skills_section.group(1)
        # Extraire les compétences individuelles
        skills = re.findall(r'[\w\+\#\.\-]+(?:\s+[\w\+\#\.\-]+){0,3}', skills_text)
        result["technical_skills"] = [skill.strip() for skill in skills if len(skill.strip()) > 2]
    
    # Extraire les langues
    languages_section = re.search(r'(?:Langues|Languages|LANGUAGES)[^\n]*\n(.*?)(?:\n\n|\n[A-Z])', cv_text, re.DOTALL)
    if languages_section:
        languages_text = languages_section.group(1)
        languages = re.findall(r'([A-Za-z]+)(?:\s*:\s*([A-Za-z]+))?', languages_text)
        result["languages"] = [{"language": lang[0].strip(), "level": lang[1].strip() if len(lang) > 1 and lang[1].strip() else ""}
                              for lang in languages if lang[0].strip()]
    
    # Extraire les expériences professionnelles
    experiences_section = re.search(r'(?:Expériences|Experience|EXPERIENCE|EXPÉRIENCES)[^\n]*\n(.*?)(?:\n\n\s*(?:Formation|Education|EDUCATION|FORMATION)|\Z)', cv_text, re.DOTALL)
    if experiences_section:
        experiences_text = experiences_section.group(1)
        # Diviser en expériences individuelles (supposant qu'elles commencent par une date)
        experience_blocks = re.split(r'\n(?=\d{4}|\d{2}/\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)', experiences_text)
        
        for block in experience_blocks:
            if not block.strip():
                continue
                
            experience = {}
            
            # Extraire la période
            date_match = re.search(r'(\d{2}/\d{4}|\d{4})\s*(?:-|–|to)\s*(\d{2}/\d{4}|\d{4}|[Pp]résent|[Pp]resent|[Cc]urrent)', block)
            if date_match:
                experience["period"] = f"{date_match.group(1)} - {date_match.group(2)}"
            
            # Extraire le poste et l'entreprise
            position_company_match = re.search(r'([^,\n]+)(?:,|\n)([^,\n]+)', block)
            if position_company_match:
                experience["position"] = position_company_match.group(1).strip()
                experience["company"] = position_company_match.group(2).strip()
            
            # Extraire la description
            description_lines = [line.strip() for line in block.split('\n') if line.strip() and not re.match(r'^\d{2}/\d{4}|\d{4}', line.strip())]
            if len(description_lines) > 2:  # Ignorer le poste et l'entreprise
                experience["description"] = ' '.join(description_lines[2:])
            
            if experience:
                result["experiences"].append(experience)
    
    # Extraire la formation
    education_section = re.search(r'(?:Formation|Education|EDUCATION|FORMATION)[^\n]*\n(.*?)(?:\n\n|\Z)', cv_text, re.DOTALL)
    if education_section:
        education_text = education_section.group(1)
        # Diviser en formations individuelles
        education_blocks = re.split(r'\n(?=\d{4}|\d{2}/\d{4})', education_text)
        
        for block in education_blocks:
            if not block.strip():
                continue
                
            education = {}
            
            # Extraire la période
            date_match = re.search(r'(\d{2}/\d{4}|\d{4})\s*(?:-|–|to)\s*(\d{2}/\d{4}|\d{4}|[Pp]résent|[Pp]resent|[Cc]urrent)', block)
            if date_match:
                education["period"] = f"{date_match.group(1)} - {date_match.group(2)}"
            
            # Extraire le diplôme et l'établissement
            degree_institution_match = re.search(r'([^,\n]+)(?:,|\n)([^,\n]+)', block)
            if degree_institution_match:
                education["degree"] = degree_institution_match.group(1).strip()
                education["institution"] = degree_institution_match.group(2).strip()
            
            if education:
                result["education"].append(education)
    
    # Combiner toutes les compétences
    result["skills"] = result["technical_skills"] + result["soft_skills"]
    
    return result

def suggest_job_search_categories(cv_analysis):
    """
    Suggère des catégories de recherche d'emploi basées sur l'analyse du CV.
    
    Args:
        cv_analysis: Dictionnaire contenant l'analyse du CV
        
    Returns:
        Dictionnaire contenant les catégories et mots-clés suggérés avec pondération
    """
    suggestions = {
        "technical_skills": {},
        "job_titles": {},
        "industries": {},
        "locations": {},
        "contract_types": {"CDI": 1.0, "CDD": 0.8, "Freelance": 0.6}
    }
    
    # Analyser les compétences techniques
    for skill in cv_analysis.get("technical_skills", []):
        skill = skill.lower()
        # Ignorer les compétences trop courtes ou trop génériques
        if len(skill) < 3 or skill in ["and", "the", "for", "with"]:
            continue
        
        # Attribuer une pondération basée sur la fréquence dans les expériences
        weight = 0.7  # Pondération par défaut
        
        # Vérifier si la compétence apparaît dans les descriptions d'expérience
        for exp in cv_analysis.get("experiences", []):
            description = exp.get("description", "").lower()
            if skill in description:
                weight += 0.1  # Augmenter la pondération si la compétence est mentionnée dans une expérience
        
        # Limiter la pondération à 1.0
        weight = min(1.0, weight)
        
        suggestions["technical_skills"][skill] = weight
    
    # Suggérer des titres de poste basés sur les expériences
    for exp in cv_analysis.get("experiences", []):
        position = exp.get("position", "").lower()
        if position:
            # Attribuer une pondération basée sur la récence (supposant que les expériences sont triées par ordre chronologique inverse)
            index = cv_analysis.get("experiences", []).index(exp)
            weight = 1.0 - (index * 0.1)  # Diminuer la pondération pour les expériences plus anciennes
            weight = max(0.6, weight)  # Garantir une pondération minimale de 0.6
            
            suggestions["job_titles"][position] = weight
    
    # Suggérer des industries basées sur les expériences
    industries = set()
    for exp in cv_analysis.get("experiences", []):
        company = exp.get("company", "")
        description = exp.get("description", "")
        
        # Extraire des indices d'industrie à partir de la description
        industry_keywords = ["tech", "IT", "software", "web", "mobile", "finance", "banking", "insurance", 
                            "healthcare", "medical", "education", "retail", "e-commerce", "manufacturing", 
                            "consulting", "media", "marketing", "telecom"]
        
        for keyword in industry_keywords:
            if keyword.lower() in description.lower() or keyword.lower() in company.lower():
                industries.add(keyword)
    
    # Attribuer une pondération aux industries
    for industry in industries:
        suggestions["industries"][industry] = 0.8
    
    return suggestions

def main():
    if len(sys.argv) != 2:
        print("Usage: python extract_cv.py <pdf_path>")
        return 1
    
    pdf_path = sys.argv[1]
    
    # Extraire le texte du PDF
    cv_text = extract_text_from_pdf(pdf_path)
    if not cv_text:
        print("Impossible d'extraire le texte du CV.")
        return 1
    
    # Analyser le CV
    cv_analysis = analyze_cv(cv_text)
    
    # Suggérer des catégories de recherche d'emploi
    search_suggestions = suggest_job_search_categories(cv_analysis)
    
    # Afficher les résultats
    print("\n=== Analyse du CV ===\n")
    
    if cv_analysis.get("name"):
        print(f"Nom: {cv_analysis['name']}")
    
    if cv_analysis.get("contact"):
        print("\nContact:")
        for key, value in cv_analysis["contact"].items():
            print(f"  {key}: {value}")
    
    if cv_analysis.get("technical_skills"):
        print("\nCompétences techniques:")
        for skill in cv_analysis["technical_skills"]:
            print(f"  - {skill}")
    
    if cv_analysis.get("languages"):
        print("\nLangues:")
        for lang in cv_analysis["languages"]:
            level = f" ({lang['level']})" if lang['level'] else ""
            print(f"  - {lang['language']}{level}")
    
    if cv_analysis.get("experiences"):
        print("\nExpériences professionnelles:")
        for exp in cv_analysis["experiences"]:
            period = f" ({exp['period']})" if exp.get('period') else ""
            company = f" chez {exp['company']}" if exp.get('company') else ""
            print(f"  - {exp.get('position', 'Poste non spécifié')}{company}{period}")
    
    if cv_analysis.get("education"):
        print("\nFormation:")
        for edu in cv_analysis["education"]:
            period = f" ({edu['period']})" if edu.get('period') else ""
            institution = f" à {edu['institution']}" if edu.get('institution') else ""
            print(f"  - {edu.get('degree', 'Diplôme non spécifié')}{institution}{period}")
    
    print("\n=== Suggestions de recherche d'emploi ===\n")
    
    for category, keywords in search_suggestions.items():
        if keywords:
            print(f"\n{category.replace('_', ' ').title()}:")
            sorted_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)
            for keyword, weight in sorted_keywords:
                print(f"  - {keyword} (pondération: {weight:.1f})")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
