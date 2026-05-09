"""
Seed ALL Frameworks from clean data folder
"""
import asyncio
import uuid
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.compliance import Framework, organization_frameworks
from app.models.identity import Organization
from app.models.enums import FrameworkType, FrameworkCategory
from app.models.assets_risks import Asset, Risk, Document, DocumentChunk  # Import all models
from app.models.assessments import Assessment, AssessmentSession, AssessmentAnswer  # Import all models


# All frameworks from data_inventory.csv with professional metadata
FRAMEWORKS_DATA = [
    {
        "name": "ISO 27001",
        "version": "2022",
        "description": "International standard for information security management systems (ISMS). Provides requirements for establishing, implementing, maintaining and continually improving an information security management system.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.INFORMATION_SECURITY,
        "region": "Global",
        "industry": "General",
        "is_mandatory": False,
        "official_url": "https://www.iso.org/standard/27001"
    },
    {
        "name": "NIST Cybersecurity Framework",
        "version": "2.0",
        "description": "Framework for improving critical infrastructure cybersecurity. Provides guidance on managing and reducing cybersecurity risk through five core functions: Govern, Identify, Protect, Detect, Respond, and Recover.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.CYBERSECURITY,
        "region": "United States",
        "industry": "General",
        "is_mandatory": False,
        "official_url": "https://www.nist.gov/cyberframework"
    },
    {
        "name": "NIST SP 800-53",
        "version": "Rev. 5",
        "description": "Security and Privacy Controls for Information Systems and Organizations. Comprehensive catalog of security and privacy controls for federal information systems and organizations.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.INFORMATION_SECURITY,
        "region": "United States",
        "industry": "Government",
        "is_mandatory": True,
        "official_url": "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final"
    },
    {
        "name": "SOC 2",
        "version": "2017",
        "description": "Service Organization Control 2 - Trust Service Criteria. Framework for managing customer data based on five trust service principles: Security, Availability, Processing Integrity, Confidentiality, and Privacy.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.INFORMATION_SECURITY,
        "region": "United States",
        "industry": "Technology/SaaS",
        "is_mandatory": False,
        "official_url": "https://www.aicpa.org/soc"
    },
    {
        "name": "PCI DSS",
        "version": "4.0.1",
        "description": "Payment Card Industry Data Security Standard. Set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.PAYMENT_SECURITY,
        "region": "Global",
        "industry": "Payment Processing",
        "is_mandatory": True,
        "official_url": "https://www.pcisecuritystandards.org/"
    },
    {
        "name": "COBIT",
        "version": "2019",
        "description": "Control Objectives for Information and Related Technologies. Framework for the governance and management of enterprise IT, addressing the full end-to-end business and IT functional areas of responsibility.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.IT_GOVERNANCE,
        "region": "Global",
        "industry": "General",
        "is_mandatory": False,
        "official_url": "https://www.isaca.org/resources/cobit"
    },
    {
        "name": "TISAX",
        "version": "6.0",
        "description": "Trusted Information Security Assessment Exchange. Information security assessment standard for the automotive industry based on ISO 27001 and VDA ISA catalog.",
        "framework_type": FrameworkType.STANDARD,
        "category": FrameworkCategory.AUTOMOTIVE,
        "region": "Germany/Europe",
        "industry": "Automotive",
        "is_mandatory": True,
        "official_url": "https://www.enx.com/tisax/"
    },
    {
        "name": "GDPR",
        "version": "2016/679",
        "description": "General Data Protection Regulation (EU). Comprehensive data protection law that regulates how personal data of individuals in the European Union can be collected, processed, and stored.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.DATA_PROTECTION,
        "region": "European Union",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://gdpr.eu/"
    },
    {
        "name": "HIPAA",
        "version": "1996",
        "description": "Health Insurance Portability and Accountability Act. US federal law that provides data privacy and security provisions for safeguarding medical information and protected health information (PHI).",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.HEALTHCARE,
        "region": "United States",
        "industry": "Healthcare",
        "is_mandatory": True,
        "official_url": "https://www.hhs.gov/hipaa/"
    },
    {
        "name": "HITECH",
        "version": "2009",
        "description": "Health Information Technology for Economic and Clinical Health Act. Promotes the adoption and meaningful use of health information technology, strengthens HIPAA privacy and security protections.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.HEALTHCARE,
        "region": "United States",
        "industry": "Healthcare",
        "is_mandatory": True,
        "official_url": "https://www.hhs.gov/hipaa/for-professionals/special-topics/hitech-act-enforcement-interim-final-rule/"
    },
    {
        "name": "SOX",
        "version": "2002",
        "description": "Sarbanes-Oxley Act. US federal law that sets requirements for all US public company boards, management and public accounting firms regarding financial reporting and internal controls.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.FINANCIAL,
        "region": "United States",
        "industry": "Financial/Public Companies",
        "is_mandatory": True,
        "official_url": "https://www.sec.gov/spotlight/sarbanes-oxley.htm"
    },
    {
        "name": "CCPA",
        "version": "2018",
        "description": "California Consumer Privacy Act. State statute intended to enhance privacy rights and consumer protection for residents of California, USA.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.PRIVACY,
        "region": "California, USA",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://oag.ca.gov/privacy/ccpa"
    },
    {
        "name": "FCRA",
        "version": "1970",
        "description": "Fair Credit Reporting Act. US federal law that regulates the collection, dissemination, and use of consumer credit information.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.FINANCIAL,
        "region": "United States",
        "industry": "Financial/Credit Reporting",
        "is_mandatory": True,
        "official_url": "https://www.ftc.gov/legal-library/browse/statutes/fair-credit-reporting-act"
    },
    {
        "name": "LGPD",
        "version": "2018",
        "description": "Lei Geral de Proteção de Dados (General Data Protection Law). Brazilian data protection law that regulates the processing of personal data.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.DATA_PROTECTION,
        "region": "Brazil",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd"
    },
    {
        "name": "PIPEDA",
        "version": "2000",
        "description": "Personal Information Protection and Electronic Documents Act. Canadian federal privacy law for private-sector organizations that governs how businesses collect, use and disclose personal information.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.PRIVACY,
        "region": "Canada",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/"
    },
    {
        "name": "PIPL",
        "version": "2021",
        "description": "Personal Information Protection Law. China's comprehensive data protection law that regulates the processing of personal information.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.DATA_PROTECTION,
        "region": "China",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "http://www.npc.gov.cn/englishnpc/c23934/202108/a8c4e3672c74491a80b53a172bb753fe.shtml"
    },
    {
        "name": "Egypt PDPL",
        "version": "2020",
        "description": "Egypt Personal Data Protection Law. Egyptian law that regulates the collection, processing, and protection of personal data.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.DATA_PROTECTION,
        "region": "Egypt",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://www.dpa.gov.eg/"
    },
    {
        "name": "UAE PDPL",
        "version": "2021",
        "description": "UAE Personal Data Protection Law. Federal law regulating the processing of personal data in the United Arab Emirates.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.DATA_PROTECTION,
        "region": "United Arab Emirates",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://u.ae/en/about-the-uae/digital-uae/data/data-protection"
    },
    {
        "name": "Morocco Law 09-08",
        "version": "2009",
        "description": "Morocco Personal Data Protection Law. Moroccan law regarding the protection of individuals with regard to the processing of personal data.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.DATA_PROTECTION,
        "region": "Morocco",
        "industry": "General",
        "is_mandatory": True,
        "official_url": "https://www.cndp.ma/"
    },
    {
        "name": "DORA",
        "version": "2022",
        "description": "Digital Operational Resilience Act. EU regulation on digital operational resilience for the financial sector, establishing requirements for ICT risk management.",
        "framework_type": FrameworkType.REGULATION,
        "category": FrameworkCategory.FINANCIAL,
        "region": "European Union",
        "industry": "Financial Services",
        "is_mandatory": True,
        "official_url": "https://www.digital-operational-resilience-act.com/"
    },
]


async def seed_all_frameworks():
    """Seed all frameworks from clean data folder"""
    print("=" * 70)
    print("🌱 Seeding ALL Frameworks from Clean Data")
    print("=" * 70)
    print()
    
    # Get organization
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Organization))
        org = result.scalars().first()
        
        if not org:
            print("❌ No organization found! Please run seed_first_org.py first.")
            return
        
        print(f"📊 Organization: {org.name} (ID: {org.id})")
        print()
        
        added_count = 0
        skipped_count = 0
        
        print("🔧 Processing frameworks...")
        print()
        
        for fw_data in FRAMEWORKS_DATA:
            # Check if framework already exists for this organization
            result = await session.execute(
                select(Framework)
                .join(organization_frameworks, Framework.id == organization_frameworks.c.framework_id)
                .where(
                    organization_frameworks.c.organization_id == org.id,
                    Framework.name == fw_data["name"]
                )
            )
            existing_fw = result.scalar_one_or_none()
            
            if existing_fw:
                print(f"  ⏭️  {fw_data['name']} - Already exists")
                skipped_count += 1
                continue
            
            # Create framework with all metadata (without organization_id)
            framework = Framework(
                name=fw_data["name"],
                version=fw_data["version"],
                description=fw_data["description"],
                framework_type=fw_data["framework_type"],
                category=fw_data["category"],
                region=fw_data.get("region"),
                industry=fw_data.get("industry"),
                is_mandatory=fw_data.get("is_mandatory", False),
                official_url=fw_data.get("official_url")
            )
            session.add(framework)
            await session.flush()  # Flush to get the framework ID
            
            # Create the organization-framework association
            await session.execute(
                organization_frameworks.insert().values(
                    organization_id=org.id,
                    framework_id=framework.id
                )
            )
            
            type_badge = "📜" if fw_data["framework_type"] == FrameworkType.REGULATION else "📋"
            mandatory_badge = "⚠️" if fw_data.get("is_mandatory") else "✓"
            print(f"  {type_badge} {mandatory_badge} {fw_data['name']} v{fw_data['version']} ({fw_data['region']})")
            added_count += 1
        
        await session.commit()
        
        print()
        print("=" * 70)
        print("✅ Framework Seeding Complete!")
        print("=" * 70)
        print()
        print(f"📊 Summary:")
        print(f"  • Added: {added_count} frameworks")
        print(f"  • Skipped: {skipped_count} frameworks (already exist)")
        print(f"  • Total: {len(FRAMEWORKS_DATA)} frameworks")
        print()
        
        # Show breakdown by type
        types = {}
        for fw in FRAMEWORKS_DATA:
            fw_type = fw['framework_type'].value
            types[fw_type] = types.get(fw_type, 0) + 1
        
        print("📊 Breakdown by Type:")
        for fw_type, count in sorted(types.items()):
            print(f"  • {fw_type.upper()}: {count}")
        print()
        
        # Show breakdown by category
        categories = {}
        for fw in FRAMEWORKS_DATA:
            cat = fw['category'].value.replace('_', ' ').title()
            categories[cat] = categories.get(cat, 0) + 1
        
        print("📂 Breakdown by Category:")
        for cat, count in sorted(categories.items()):
            print(f"  • {cat}: {count}")
        print()
        
        # Show breakdown by region
        regions = {}
        for fw in FRAMEWORKS_DATA:
            reg = fw['region']
            regions[reg] = regions.get(reg, 0) + 1
        
        print("🌍 Breakdown by Region:")
        for reg, count in sorted(regions.items()):
            print(f"  • {reg}: {count}")
        print()
        
        # Show mandatory vs optional
        mandatory_count = sum(1 for fw in FRAMEWORKS_DATA if fw.get('is_mandatory'))
        optional_count = len(FRAMEWORKS_DATA) - mandatory_count
        print("⚖️ Mandatory vs Optional:")
        print(f"  • Mandatory (Legal Requirement): {mandatory_count}")
        print(f"  • Optional (Best Practice): {optional_count}")
        print()


if __name__ == "__main__":
    asyncio.run(seed_all_frameworks())
