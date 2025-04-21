=====================vue3 vite, typescript 기반 프로젝트 생성 및 firebase 환경 셋팅=====================
1. npm create vue@latest
=> 실수로 pinia 선택안했다면 npm install pinia 으로 설치
2. npm install 

<!-- (선택) firebase 설치 -->
3. npm install firebase
4. npm i -g firebase-tools
5. firebase login
6. firebase init
<!-- // firebase -->

<!-- (선택) SCSS 설치 -->
7. npm install -D sass
src/assets/scss/common.scss 추가(없으면 만들어야함)
<!-- // SCSS 설치 -->

=====================로컬 실행===================== 
1. npm run dev

=====================git 업로드===================== 
1. git add .
2. git commit -m "내용" 
3. git push -u origin develop (본인 브랜치)
4. github에서 pull requests -> merge
5. git pull origin main (최종 브랜치)

=====================실제 서버에 배포=====================
1. npm run build 
2. firebase deploy