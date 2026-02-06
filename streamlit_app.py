
import streamlit as st
import os
import google.generativeai as genai
from datetime import datetime

# Initialize Session State
if 'handbook_output' not in st.session_state:
    st.session_state['handbook_output'] = ""

# Configure Gemini
api_key = os.getenv("API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Page Config
st.set_page_config(
    page_title="Digital FTE Orchestrator",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Professional Aesthetic (Obsidian-Dark / Slate-950)
st.markdown("""
    <style>
    /* Main Background and Text */
    .stApp {
        background-color: #020617;
        color: #f8fafc;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #0f172a !important;
        border-right: 1px solid #1e293b;
    }
    
    /* Typography */
    h1, h2, h3 {
        font-family: 'Inter', sans-serif;
        font-weight: 800;
        letter-spacing: -0.025em;
    }
    
    .stMarkdown p {
        color: #94a3b8;
    }
    
    /* Form Inputs */
    .stTextInput input, .stTextArea textarea {
        background-color: #020617 !important;
        border: 1px solid #1e293b !important;
        color: #f8fafc !important;
        border-radius: 12px !important;
    }
    
    /* Buttons */
    .stButton>button {
        width: 100%;
        background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
        color: white;
        border: none;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        font-weight: 700;
        transition: all 0.2s ease;
    }
    
    .stButton>button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
    
    /* Badges */
    .status-badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 12px;
        border-radius: 9999px;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.2);
    }
    </style>
    """, unsafe_allow_html=True)

# Sidebar Logic
with st.sidebar:
    st.markdown("### 🛠 AI ORCHESTRATOR")
    st.caption("Personal AI Employee Hackathon 0")
    
    with st.form("handbook_form"):
        st.markdown("##### Identity Context")
        fte_name = st.text_input("FTE Alias / Company", placeholder="e.g. SalesEngine")
        fte_focus = st.text_area("Operational Focus", placeholder="Core mission and directives...")
        
        st.markdown("---")
        st.markdown("##### Core Tech Blueprint")
        col1, col2 = st.columns(2)
        with col1:
            use_spec = st.checkbox("Spec Kit")
            use_claude = st.checkbox("Claude Code")
        with col2:
            use_qwen = st.checkbox("Qwen")
            
        st.markdown("---")
        submit = st.form_submit_button("BUILD HANDBOOK")

# Main Content Area
col_left, col_right = st.columns([2, 1])

with col_left:
    st.title("Hire your first Digital FTE")
    st.markdown("Autonomous, professional-grade, and cloud-ready. Deploy your operational logic to the edge.")
    
    if submit:
        if not fte_name or not fte_focus:
            st.error("Missing Identity Context. Please define the FTE Alias and Focus.")
        elif not api_key:
            st.error("API_KEY environment variable not found.")
        else:
            with st.spinner("Synthesizing Operational Logic..."):
                try:
                    # Construct Stack
                    stack = []
                    if use_spec: stack.append("Spec Kit")
                    if use_claude: stack.append("Claude Code")
                    if use_qwen: stack.append("Qwen")
                    
                    stack_ctx = ", ".join(stack) if stack else "Standard AI Stack"
                    
                    # Gemini Prompt
                    prompt = f"""
                    Act as a senior AI Architect. Generate a professional 'Company_Handbook.md' for an AI-powered Digital FTE for a company called "{fte_name}".
                    The focus of this AI employee is: {fte_focus}.
                    
                    The tech stack includes: {stack_ctx}. 
                    - If 'Spec Kit' is selected, define documentation using standard specification templates.
                    - If 'Claude Code' is selected, define CLI-based interaction logic.
                    - If 'Qwen' is selected, specify reasoning tasks for high-throughput LLMs.

                    Include sections for Mission, Architecture, Operational Rules, Security, and Daily Routine.
                    Format the response in clean, professional Markdown.
                    """
                    
                    model = genai.GenerativeModel('gemini-1.5-flash-latest')
                    response = model.generate_content(prompt)
                    st.session_state['handbook_output'] = response.text
                    st.success("Operational Asset Ready.")
                except Exception as e:
                    st.error(f"Synthesis failed: {str(e)}")

    if st.session_state['handbook_output']:
        st.markdown("---")
        st.markdown("### 📄 Asset Preview: Handbook.md")
        st.markdown(st.session_state['handbook_output'])
        st.download_button(
            label="💾 Download Operational Asset",
            data=st.session_state['handbook_output'],
            file_name=f"Handbook_{fte_name.replace(' ', '_')}.md",
            mime="text/markdown"
        )
    else:
        # Placeholder / Empty State
        st.info("Configure the FTE Orchestrator in the sidebar to generate operational assets.")

with col_right:
    st.markdown("### 🚀 Deployment")
    st.markdown("""
        <div class="status-badge">System Active</div>
    """, unsafe_allow_html=True)
    
    st.markdown("---")
    st.markdown("##### Cloud Status")
    st.code("Provider: AWS Edge\nRegion: us-east-1\nRuntime: Python 3.11", language="text")
    
    st.markdown("##### System Stats")
    st.progress(0.42, text="Memory: 14.2MB / 128MB")
    st.progress(0.15, text="CPU: 15% Utilization")
    
    st.markdown("---")
    st.markdown("##### Log Stream")
    st.caption(f"[{datetime.now().strftime('%H:%M:%S')}] FTE_ARCHITECT initialized.")
    if submit:
        st.caption(f"[{datetime.now().strftime('%H:%M:%S')}] Synthesis event triggered.")
        st.caption(f"[{datetime.now().strftime('%H:%M:%S')}] Prompt sent to Gemini Flash.")

st.markdown("---")
st.caption("FTE_ARCHITECT @ local_host: Monitoring events... Ready for Vercel and Streamlit deployment.")
